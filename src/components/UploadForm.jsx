// src/components/UploadForm.jsx
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import './UploadForm.css';

function UploadForm() {
  const [file, setFile] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [sourceLang, setSourceLang] = useState('french');
  const [targetLang, setTargetLang] = useState('french');
  const [vulgarizationLevel, setVulgarizationLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('unknown');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fonction pour compter les pages du PDF
  const countPages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch (err) {
      console.error('Erreur lors du comptage des pages:', err);
      return 0;
    }
  };

  // Mettre à jour le temps estimé quand le fichier change
  useEffect(() => {
    if (file) {
      countPages(file).then(count => {
        setPageCount(count);
        // Estimation : 30 secondes par page
        const estimatedSeconds = count * 30;
        setEstimatedTime(estimatedSeconds);
        setTimeRemaining(estimatedSeconds);
      });
    }
  }, [file]);

  // Mettre à jour le temps restant pendant le traitement
  useEffect(() => {
    let timer;
    if (loading && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, timeRemaining]);

  // Formatage du temps en minutes et secondes
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Fonction pour réveiller le serveur
  const wakeUpServer = async () => {
    try {
      setStatus('Réveil du serveur...');
      const res = await fetch('https://slide2latex-backend.onrender.com/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        setServerStatus('ready');
        setStatus('Serveur prêt !');
        return true;
      }
    } catch (err) {
      console.error('Erreur lors du réveil du serveur:', err);
    }
    return false;
  };

  // Vérifier l'état du serveur au chargement du composant
  useEffect(() => {
    wakeUpServer();
  }, []);

  const fetchWithTimeout = async (url, options, timeout = 300000) => { // 5 minutes par défaut
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        throw new Error('La requête a expiré. Le serveur met peut-être trop de temps à répondre. Veuillez réessayer.');
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please upload a PDF');

    // Réveiller le serveur avant de soumettre
    if (serverStatus !== 'ready') {
      setStatus('Réveil du serveur...');
      const isReady = await wakeUpServer();
      if (!isReady) {
        setError('Impossible de réveiller le serveur. Veuillez réessayer dans quelques instants.');
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_title', courseTitle);
    formData.append('source_language', sourceLang);
    formData.append('target_language', targetLang);
    formData.append('vulgarization_level', vulgarizationLevel);

    setLoading(true);
    setProgress(0);
    setUploadProgress(0);
    setStatus('Initialisation...');
    setError(null);

    // Définir le nom du fichier à l'avance
    const fileName = `${courseTitle.replace(/\s+/g, '_').toLowerCase() || 'document'}.tex`;
    setDownloadFileName(fileName);

    try {
      setStatus('Envoi du fichier...');
      setProgress(10);

      const res = await fetchWithTimeout('https://slide2latex-backend.onrender.com/process/', {
        method: 'POST',
        body: formData,
      }, 300000); // 5 minutes de timeout

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Erreur serveur: ${res.status}`);
      }

      setStatus('Traitement en cours...');
      setProgress(30);

      const data = await res.json();
      setResponse(data);

      // Simulation de la progression comme avant
      const totalSteps = 10;
      const stepDuration = 1000; // 1 seconde par étape
      
      for (let i = 0; i < totalSteps; i++) {
        setStatus(`Traitement de la slide ${i + 1}/${totalSteps}...`);
        setProgress(30 + (i * 7)); // De 30% à 100%
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }

      setStatus('Terminé !');
      setProgress(100);

      // Téléchargement automatique
      await handleDownload();

    } catch (err) {
      console.error('Upload failed', err);
      setError(err.message);
      setStatus('Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!response?.file_id) {
      setError('Aucun fichier à télécharger');
      return;
    }
    
    try {
      setStatus('Téléchargement du fichier...');
      const res = await fetchWithTimeout(
        `https://slide2latex-backend.onrender.com/download/${response.file_id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf'
          }
        },
        30000
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erreur lors du téléchargement: ${res.status}`);
      }

      // Récupérer le type de contenu et le nom du fichier
      const contentType = res.headers.get('content-type');
      const contentDisposition = res.headers.get('content-disposition');
      let filename = downloadFileName;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Créer le blob et le lien de téléchargement
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('Téléchargement terminé !');
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError(err.message);
      setStatus('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="upload-form">
        <h2>Convertir un cours PDF</h2>

        {error && (
          <div className="error-message">
            {error}
            <p className="error-suggestion">
              Si le problème persiste, essayez de :
              <ul>
                <li>Réduire la taille du fichier PDF</li>
                <li>Attendre quelques minutes avant de réessayer</li>
                <li>Vérifier votre connexion internet</li>
              </ul>
            </p>
          </div>
        )}

        {file && !loading && (
          <div className="file-info">
            <p>Nombre de pages : {pageCount}</p>
            <p>Temps estimé : {formatTime(estimatedTime)}</p>
            <p>Fichier de sortie : {downloadFileName}</p>
          </div>
        )}

        <div className="form-group">
          <label className="file-input-label">
            <span>Choisir un fichier PDF</span>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
          </label>
          {file && <p className="file-name">{file.name}</p>}
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Titre du cours"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            className="text-input"
          />
        </div>

        <div className="form-group">
          <label>Langue source :</label>
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="select-input">
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        <div className="form-group">
          <label>Langue cible :</label>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="select-input">
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        <div className="form-group">
          <label>Niveau de vulgarisation :</label>
          <select value={vulgarizationLevel} onChange={(e) => setVulgarizationLevel(Number(e.target.value))} className="select-input">
            <option value={0}>Aucune</option>
            <option value={1}>Minimale</option>
            <option value={2}>Légère</option>
            <option value={3}>Modérée</option>
            <option value={4}>Élevée</option>
            <option value={5}>Maximale</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading || serverStatus !== 'ready'} 
          className="submit-button"
        >
          {loading ? 'Envoi en cours...' : serverStatus === 'ready' ? 'Envoyer' : 'Serveur en veille...'}
        </button>

        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {uploadProgress > 0 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">Progression de l'envoi : {Math.round(uploadProgress)}%</p>
              </div>
            )}
            <p className="progress-status">{status}</p>
            <p className="progress-hint">
              Temps restant estimé : {formatTime(timeRemaining)}
              <br />
              Le traitement peut prendre plusieurs minutes selon la taille du fichier.
              Veuillez ne pas fermer cette page pendant le traitement.
            </p>
          </div>
        )}

        {response && (
          <div className="response-container">
            <h4>Réponse du serveur :</h4>
            <pre className="response-pre">{JSON.stringify(response, null, 2)}</pre>
            
            <div className="download-section">
              <div className="form-group">
                <label>Nom du fichier à télécharger :</label>
                <input
                  type="text"
                  value={downloadFileName}
                  onChange={(e) => setDownloadFileName(e.target.value)}
                  className="text-input"
                  placeholder="nom_du_fichier.tex"
                />
              </div>
              
              <button 
                onClick={handleDownload}
                className="download-button"
              >
                Télécharger le fichier .tex
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default UploadForm;