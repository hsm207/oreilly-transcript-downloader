// UI: Popup
// Stub for popup UI component
import { useEffect, useState } from 'react';
import styles from './Popup.module.css';
import {
  getCurrentPageInfo,
  requestTranscriptDownload,
  requestAllTranscriptsDownload,
} from '../application/PopupService';

export const Popup = () => {
  const [isVideoPage, setIsVideoPage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPageInfo().then((pageInfo) => {
      setIsVideoPage(pageInfo.isVideoPage);
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
      {isVideoPage ? (
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
      ) : (
        <div style={{ textAlign: 'center', color: '#ffb199', fontWeight: 500 }}>
          Transcript download is only available on O'Reilly video pages.
        </div>
      )}
    </div>
  );
};
