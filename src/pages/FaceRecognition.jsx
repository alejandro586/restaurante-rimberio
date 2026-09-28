import React, { useState, useRef } from 'react';
import { compressImage, fetchLandmarks, fetchCompareFaces } from '../api';
import './FaceRecognition.css';

export default function FaceRecognition() {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [predsA, setPredsA] = useState([]);
  const [predsB, setPredsB] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [status, setStatus] = useState('Carga ambas imágenes para habilitar la comparación.');
  const [loading, setLoading] = useState(false);

  const imgRefA = useRef(null);
  const imgRefB = useRef(null);
  const canvasRefA = useRef(null);
  const canvasRefB = useRef(null);

  const drawLandmarks = (imgElem, canvasElem, data) => {
    if (!data || data.length === 0 || !data[0].faceLandmarks) return;

    canvasElem.width = imgElem.clientWidth;
    canvasElem.height = imgElem.clientHeight;
    const ctx = canvasElem.getContext('2d');
    ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

    const scaleX = imgElem.clientWidth / imgElem.naturalWidth;
    const scaleY = imgElem.clientHeight / imgElem.naturalHeight;
    const lm = data[0].faceLandmarks;

    const points = [lm.pupilLeft, lm.pupilRight, lm.noseTip, lm.mouthLeft, lm.mouthRight, lm.underLipBottom];
    points.forEach((pt) => {
      if (pt) {
        ctx.beginPath();
        ctx.arc(pt.x * scaleX, pt.y * scaleY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.strokeStyle = '#e0e7ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  const handleFileChange = async (e, side) => {
    const raw = e.target.files[0];
    if (!raw) return;

    setVerdict(null);
    setStatus(`Procesando Rostro ${side}...`);

    try {
      const compressed = await compressImage(raw);
      const url = URL.createObjectURL(compressed);

      if (side === 'A') {
        setFileA(compressed);
        setPreviewA(url);
        setPredsA([]);
      } else {
        setFileB(compressed);
        setPreviewB(url);
        setPredsB([]);
      }

      const data = await fetchLandmarks(compressed);
      const imgElem = side === 'A' ? imgRefA.current : imgRefB.current;
      const canvasElem = side === 'A' ? canvasRefA.current : canvasRefB.current;

      if (imgElem.complete) {
        drawLandmarks(imgElem, canvasElem, data);
      } else {
        imgElem.onload = () => drawLandmarks(imgElem, canvasElem, data);
      }

      setStatus('Imagen procesada.');
    } catch (err) {
      console.error(err);
      setStatus(`Error procesando Imagen ${side}`);
    }
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    setLoading(true);
    setStatus('Consultando clasificaciones en Azure...');

    try {
      const data = await fetchCompareFaces(fileA, fileB);
      setPredsA(data.predictionsA || []);
      setPredsB(data.predictionsB || []);
      setVerdict(data.verdict);
      setStatus('Comparación completada con éxito.');
    } catch (err) {
      setStatus(err.message || 'Error en la conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-container">
      <h2>Comparación Biométrica Facial (1:1 Verification)</h2>
      <p>Carga dos rostros para verificar si pertenecen a la misma identidad</p>

      <div className="comparison-grid">
        {/* Rostro A */}
        <div className="photo-box">
          <h4>Rostro A</h4>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'A')} />
          {previewA && (
            <div className="image-wrapper">
              <img ref={imgRefA} src={previewA} alt="Rostro A" />
              <canvas ref={canvasRefA} />
            </div>
          )}
          <div className="predictions-list">
            {predsA.map((p, idx) => (
              <div key={idx} className={`pred-item ${idx === 0 ? 'top' : ''}`}>
                <div className="progress-bar-bg" style={{ width: `${(p.probability * 100).toFixed(1)}%` }} />
                <div className="pred-content">
                  <span>{p.tagName}</span>
                  <span>{(p.probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rostro B */}
        <div className="photo-box">
          <h4>Rostro B</h4>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'B')} />
          {previewB && (
            <div className="image-wrapper">
              <img ref={imgRefB} src={previewB} alt="Rostro B" />
              <canvas ref={canvasRefB} />
            </div>
          )}
          <div className="predictions-list">
            {predsB.map((p, idx) => (
              <div key={idx} className={`pred-item ${idx === 0 ? 'top' : ''}`}>
                <div className="progress-bar-bg" style={{ width: `${(p.probability * 100).toFixed(1)}%` }} />
                <div className="pred-content">
                  <span>{p.tagName}</span>
                  <span>{(p.probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="action-btn" disabled={!fileA || !fileB || loading} onClick={handleCompare}>
        {loading ? 'Comparando...' : 'Comparar Rostros'}
      </button>

      <div className="status">{status}</div>

      {verdict && (
        <div className={`verdict-card ${verdict.isMatch ? 'match' : 'no-match'}`}>
          {verdict.isMatch ? (
            <>
              COINCIDENCIA CONFIRMADA: Misma Persona ({verdict.identityA})
              <br />
              <span style={{ fontSize: '0.9rem' }}>Certeza promedio: {verdict.averageConfidence}%</span>
            </>
          ) : (
            `ACCESO DENEGADO: Personas Distintas (${verdict.identityA} vs ${verdict.identityB})`
          )}
        </div>
      )}
    </div>
  );
}