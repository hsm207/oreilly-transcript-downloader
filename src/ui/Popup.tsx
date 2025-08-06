// UI: Popup
// Stub for popup UI component

import { useEffect, useState } from 'react';
import styles from './Popup.module.css';
import {
  getCurrentPageInfo,
  requestTranscriptDownload,
  requestAllTranscriptsDownload,
  requestChapterPdfDownload,
  requestAllChaptersPdfDownload,
} from '../application/PopupService';
import { ContentType } from '../domain/content/ContentType';


export const Popup = () => {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPageInfo().then((pageInfo) => {
      setContentType(pageInfo.contentType);
      setLoading(false);
    });
  }, []);

  const handleDownload = () => {
    requestTranscriptDownload();
  };

  if (loading)
    return (
      <div className={styles.popupContainer}>
        <h3 className={styles.popupTitle}>O'Reilly Transcript Downloader</h3>
        <div>Loading...</div>
      </div>
    );

  return (
    <div className={styles.popupContainer}>
      <h3 className={styles.popupTitle}>O'Reilly Transcript Downloader</h3>
      {contentType === ContentType.Video && (
        <>
          <button className={styles.downloadButton} onClick={handleDownload}>
            Download Transcript
          </button>
          <button
            className={styles.downloadButton}
            style={{ marginTop: 12 }}
            onClick={requestAllTranscriptsDownload}
          >
            Download All Transcripts
          </button>
        </>
      )}
      {contentType === ContentType.Book && (
        <>
          <button
            className={styles.downloadButton}
            style={{ marginTop: 12, background: '#e63946', color: '#fff' }}
            onClick={requestChapterPdfDownload}
          >
            Download Chapter as PDF
          </button>
          <button
            className={styles.downloadButton}
            style={{ marginTop: 12, background: '#457b9d', color: '#fff' }}
            onClick={requestAllChaptersPdfDownload}
          >
            Download All Chapters as PDF
          </button>
        </>
      )}
      {contentType === ContentType.Live && (
        <>
          <button className={styles.downloadButton} onClick={handleDownload}>
            Download Transcript
          </button>
        </>
      )}
      {contentType === null && (
        <div style={{ textAlign: 'center', color: '#ffb199', fontWeight: 500 }}>
          Download is only available on O'Reilly video, book, or live class pages.
        </div>
      )}
    </div>
  );
};
