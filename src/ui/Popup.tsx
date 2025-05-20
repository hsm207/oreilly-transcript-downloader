// UI: Popup
// Stub for popup UI component
import { useEffect, useState } from 'react';
import styles from './Popup.module.css';
import {
  getCurrentPageInfo,
  requestTranscriptDownload,
  requestAllTranscriptsDownload,
  requestChapterPdfDownload,
} from '../application/PopupService';

export const Popup = () => {
  const [isVideoPage, setIsVideoPage] = useState(false);
  const [isBookPage, setIsBookPage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPageInfo().then((pageInfo) => {
      setIsVideoPage(pageInfo.isVideoPage);
      setIsBookPage(
        !!pageInfo.url && /\/library\/view\//.test(pageInfo.url)
      );
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
      {isVideoPage && (
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
      {isBookPage && (
        <button
          className={styles.downloadButton}
          style={{ marginTop: 12, background: '#e63946', color: '#fff' }}
          onClick={requestChapterPdfDownload}
        >
          Download Chapter as PDF
        </button>
      )}
      {!isVideoPage && !isBookPage && (
        <div style={{ textAlign: 'center', color: '#ffb199', fontWeight: 500 }}>
          Download is only available on O'Reilly video or book pages.
        </div>
      )}
    </div>
  );
};
