/**
 * MPD Manifest Loader
 * Fetches and parses DASH MPD manifests
 */
import fetch from 'node-fetch';
import { parse } from 'mpd-parser';
import { ParsedMPD, MPDParserOutput, MPDParseError, MPDFetchError } from './types';
import { ErrorMessages } from './errorMessages';

export class MPDLoader {
  /**
   * Load and parse an MPD manifest from a URL
   * @param uri The MPD manifest URL
   * @param previousManifest Optional previous manifest for live stream updates
   * @returns Parsed MPD object
   * @throws {MPDFetchError} When HTTP fetch fails
   * @throws {MPDParseError} When XML parsing fails
   */
  async load(uri: string, previousManifest?: ParsedMPD): Promise<ParsedMPD> {
    try {
      const response = await fetch(uri);

      if (!response.ok) {
        throw new MPDFetchError(
          ErrorMessages.FETCH_HTTP_ERROR(response.status, response.statusText),
          response.status
        );
      }

      const manifestText = await response.text();

      // Parse using mpd-parser
      return this.parse(manifestText, uri, previousManifest);
    } catch (error) {
      // Re-throw MPDParseError and MPDFetchError as-is
      if (error instanceof MPDParseError || error instanceof MPDFetchError) {
        throw error;
      }

      // Wrap other fetch errors (network errors, timeouts, etc.)
      if (error instanceof Error) {
        throw new MPDFetchError(
          ErrorMessages.FETCH_NETWORK_ERROR(uri, error.message),
          undefined,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Parse MPD manifest text
   * @param manifestText Raw XML manifest string
   * @param manifestUri The manifest URI for resolving relative URLs
   * @param previousManifest Optional previous manifest for live stream updates
   * @returns Parsed MPD object
   * @throws {MPDParseError} When XML parsing fails
   */
  parse(manifestText: string, manifestUri: string, previousManifest?: ParsedMPD): ParsedMPD {
    try {
      // Basic XML validation before parsing
      if (!MPDLoader.isValidXML(manifestText)) {
        throw new MPDParseError(ErrorMessages.PARSE_INVALID_XML());
      }

      const parsed = parse(manifestText, {
        manifestUri,
        previousManifest,
      }) as MPDParserOutput;

      return this.extractMPDMetadata(parsed);
    } catch (error) {
      // Re-throw MPDParseError as-is
      if (error instanceof MPDParseError) {
        throw error;
      }

      // Wrap parsing errors as MPDParseError
      if (error instanceof Error) {
        throw new MPDParseError(ErrorMessages.PARSE_FAILED(error.message), error);
      }
      throw error;
    }
  }

  /**
   * Extract key MPD metadata from parsed manifest
   * The mpd-parser library converts MPD to an HLS-like structure,
   * so we need to adapt the output to our expected format
   */
  private extractMPDMetadata(parsed: MPDParserOutput): ParsedMPD {
    // Infer type from playlist endList
    // Note: Check playlist.endList (not root endList) - truthy means VOD, falsy means Live
    let streamType = 'dynamic'; // Default to live
    if (parsed.playlists && parsed.playlists.length > 0) {
      const firstPlaylist = parsed.playlists[0];
      streamType = firstPlaylist.endList ? 'static' : 'dynamic';
    }

    // The parser returns an HLS-like structure
    const mpd: ParsedMPD = {
      // Playlists (representations/variants)
      playlists: parsed.playlists || [],

      // Type inferred from playlist.endList: truthy = static (VOD), falsy = dynamic (live)
      type: streamType,

      // Duration mapping (only set if available and not zero)
      mediaPresentationDuration:
        parsed.duration && parsed.duration > 0
          ? parsed.duration
          : parsed.totalDuration && parsed.totalDuration > 0
            ? parsed.totalDuration
            : undefined,

      // Map playlists to periods (playlists represent different quality/bitrate variants)
      periods:
        parsed.playlists && parsed.playlists.length > 0
          ? [
              {
                id: '0',
                playlists: parsed.playlists,
              },
            ]
          : [],
    };

    // Include any additional properties from the parser (like publishTime)
    // This allows the parser to pass through properties we may need
    Object.keys(parsed).forEach((key) => {
      if (!(key in mpd)) {
        mpd[key] = parsed[key];
      }
    });

    return mpd;
  }

  /**
   * Check if manifest is valid XML
   * Basic check for XML structure
   */
  static isValidXML(text: string): boolean {
    try {
      // Basic XML validation - check for opening tag
      return text.trim().startsWith('<?xml') || text.trim().startsWith('<MPD');
    } catch {
      return false;
    }
  }
}
