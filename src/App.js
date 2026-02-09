import React, { useRef, useState, useEffect } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  // Start webcam on component mount
  useEffect(() => {
    startWebcam();
    return () => {
      // Cleanup: stop webcam when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError("Failed to access webcam: " + err.message);
      console.error("Error accessing webcam:", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          setCapturedImage(URL.createObjectURL(blob));
          await verifyPerson(blob);
        }
      },
      "image/jpeg",
      0.95,
    );
  };

  const verifyPerson = async (imageBlob) => {
    setIsVerifying(true);
    setVerificationResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "captured.jpg");

      const response = await fetch("http://localhost:3001/verify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerificationResult(data);
    } catch (err) {
      setError("Verification error: " + err.message);
      console.error("Verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Face Verification System</h1>
        <p className="subtitle">Verify if you are Tejas</p>

        <div className="webcam-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={capturedImage ? "hidden" : ""}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="captured-image"
            />
          )}
        </div>

        <div className="controls">
          {!capturedImage ? (
            <button onClick={capturePhoto} className="btn btn-primary">
              📸 Capture & Verify
            </button>
          ) : (
            <button onClick={resetCapture} className="btn btn-secondary">
              🔄 Capture Again
            </button>
          )}
        </div>

        {isVerifying && (
          <div className="status verifying">
            <div className="spinner"></div>
            <p>Verifying identity...</p>
          </div>
        )}

        {error && (
          <div className="status error">
            <p>❌ {error}</p>
          </div>
        )}

        {verificationResult && !isVerifying && (
          <div
            className={`status ${verificationResult.isMatch ? "success" : "failure"}`}
          >
            {verificationResult.isMatch ? (
              <>
                <p className="result-text">✅ Verified: You are Tejas!</p>
                <p className="confidence">
                  Confidence: {(verificationResult.confidence * 100).toFixed(1)}
                  %
                </p>
              </>
            ) : (
              <>
                <p className="result-text">
                  ❌ Not Verified: You are not Tejas
                </p>
                <p className="confidence">
                  Confidence: {(verificationResult.confidence * 100).toFixed(1)}
                  %
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
