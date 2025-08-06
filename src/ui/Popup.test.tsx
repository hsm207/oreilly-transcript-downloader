// UI Tests: Popup
// Tests for popup UI component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Popup } from './Popup';
import * as PopupService from '../application/PopupService';
import { ContentType } from '../domain/content/ContentType';

// Mock the PopupService
vi.mock('../application/PopupService', () => ({
  getCurrentPageInfo: vi.fn(),
  requestTranscriptDownload: vi.fn(),
  requestAllTranscriptsDownload: vi.fn(),
  requestChapterPdfDownload: vi.fn(),
  requestAllChaptersPdfDownload: vi.fn(),
}));

describe('Popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    // Mock getCurrentPageInfo to never resolve
    vi.mocked(PopupService.getCurrentPageInfo).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<Popup />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText("O'Reilly Transcript Downloader")).toBeInTheDocument();
  });

  it('should show video page buttons when contentType is Video', async () => {
    vi.mocked(PopupService.getCurrentPageInfo).mockResolvedValue({
      contentType: ContentType.Video,
      url: 'https://learning.oreilly.com/videos/some-video/123',
    });

    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('Download Transcript')).toBeInTheDocument();
      expect(screen.getByText('Download All Transcripts')).toBeInTheDocument();
    });

    // Should not show book or live class buttons
    expect(screen.queryByText('Download Chapter as PDF')).not.toBeInTheDocument();
    expect(screen.queryByText('Download All Chapters as PDF')).not.toBeInTheDocument();
  });

  it('should show book page buttons when contentType is Book', async () => {
    vi.mocked(PopupService.getCurrentPageInfo).mockResolvedValue({
      contentType: ContentType.Book,
      url: 'https://learning.oreilly.com/library/view/some-book/123',
    });

    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('Download Chapter as PDF')).toBeInTheDocument();
      expect(screen.getByText('Download All Chapters as PDF')).toBeInTheDocument();
    });

    // Should not show video or live class buttons
    expect(screen.queryByText('Download Transcript')).not.toBeInTheDocument();
    expect(screen.queryByText('Download All Transcripts')).not.toBeInTheDocument();
  });

  it('should show live class button when contentType is Live', async () => {
    vi.mocked(PopupService.getCurrentPageInfo).mockResolvedValue({
      contentType: ContentType.Live,
      url: 'https://event.on24.com/eventRegistration/console/apollox/mainEvent?simulive=y&eventid=123',
    });

    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('Download Transcript')).toBeInTheDocument();
    });

    // Should not show video course buttons (only single transcript, not "all")
    expect(screen.queryByText('Download All Transcripts')).not.toBeInTheDocument();
    // Should not show book buttons
    expect(screen.queryByText('Download Chapter as PDF')).not.toBeInTheDocument();
    expect(screen.queryByText('Download All Chapters as PDF')).not.toBeInTheDocument();
  });

  it('should show unsupported page message when contentType is null', async () => {
    vi.mocked(PopupService.getCurrentPageInfo).mockResolvedValue({
      contentType: null,
      url: 'https://some-other-site.com',
    });

    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText(/Download is only available on O'Reilly/)).toBeInTheDocument();
    });

    // Should not show any download buttons
    expect(screen.queryByText('Download Transcript')).not.toBeInTheDocument();
    expect(screen.queryByText('Download All Transcripts')).not.toBeInTheDocument();
    expect(screen.queryByText('Download Chapter as PDF')).not.toBeInTheDocument();
    expect(screen.queryByText('Download All Chapters as PDF')).not.toBeInTheDocument();
  });
});
