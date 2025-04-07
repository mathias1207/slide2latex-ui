import { useState } from "react";
import "../styles/form.css";

function UploadForm() {
  const [file, setFile] = useState(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("french");
  const [targetLanguage, setTargetLanguage] = useState("french");
  const [includeVulgarisation, setIncludeVulgarisation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLink, setPdfLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_title", courseTitle);
    formData.append("source_language", sourceLanguage);
    formData.append("target_language", targetLanguage);
    formData.append("include_vulgarisation", includeVulgarisation);

    setLoading(true);
    const response = await fetch("http://localhost:8003/process/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setLoading(false);

    if (data.pdf_path) {
      const fileId = data.file_id;
      setPdfLink(`http://localhost:8003/download/${fileId}`);
    } else {
      alert("Erreur lors du traitement.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Titre du cours :</label>
      <input
        type="text"
        value={courseTitle}
        onChange={(e) => setCourseTitle(e.target.value)}
        required
      />

      <label>Fichier PDF :</label>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />

      <label>Langue source :</label>
      <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
        <option value="french">Français</option>
        <option value="english">Anglais</option>
        <option value="hebrew">Hébreu</option>
      </select>

      <label>Langue cible :</label>
      <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
        <option value="french">Français</option>
        <option value="english">Anglais</option>
        <option value="hebrew">Hébreu</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={includeVulgarisation}
          onChange={() => setIncludeVulgarisation(!includeVulgarisation)}
        />
        Ajouter des vulgarisations
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Traitement en cours..." : "Envoyer"}
      </button>

      {pdfLink && (
        <p>
          ✅ Document prêt :{" "}
          <a href={pdfLink} target="_blank" rel="noopener noreferrer">
            Télécharger le PDF
          </a>
        </p>
      )}
    </form>
  );
}

export default UploadForm;
