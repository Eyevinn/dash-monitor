/**
 * MPD Manifest Loader
 * Fetches and parses DASH MPD manifests
 */
import fetch from 'node-fetch';
import { parse } from 'mpd-parser';
import { ParsedMPD } from './types';

export class MPDLoader {
  /**
   * Load and parse an MPD manifest from a URL
   * @param uri The MPD manifest URL
   * @param previousManifest Optional previous manifest for live stream updates
   * @returns Parsed MPD object
   */
  async load(uri: string, previousManifest?: any): Promise<ParsedMPD> {
    try {
      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifestText = await response.text();

      return this.parse(manifestText, uri, previousManifest);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load MPD from ${uri}: ${error.message}`);
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
   */
  parse(manifestText: string, manifestUri: string, previousManifest?: any): ParsedMPD {
    try {
      const parsed = parse(manifestText, {
        manifestUri,
        previousManifest
      });

      return this.extractMPDMetadata(parsed);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse MPD: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract key MPD metadata from parsed manifest
   */
  private extractMPDMetadata(parsed: any): ParsedMPD {
    const mpd: ParsedMPD = {
      type: parsed.type,
      mediaPresentationDuration: parsed.mediaPresentationDuration,
      minimumUpdatePeriod: parsed.minimumUpdatePeriod,
      publishTime: parsed.publishTime,
      availabilityStartTime: parsed.availabilityStartTime,
      timeShiftBufferDepth: parsed.timeShiftBufferDepth,
      suggestedPresentationDelay: parsed.suggestedPresentationDelay,
      periods: parsed.periods || []
    };

    // Include additional properties
    Object.keys(parsed).forEach(key => {
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
