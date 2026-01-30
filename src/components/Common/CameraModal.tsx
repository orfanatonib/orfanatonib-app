import React, { useRef, useState, useEffect } from 'react';
import { Box, Portal } from '@mui/material';
import { Cameraswitch as CameraswitchIcon, Close as CloseIcon } from '@mui/icons-material';

interface CameraModalProps {
    open: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    onError: (error: string) => void;
    variant?: 'default' | 'profile';
}

const CameraModal: React.FC<CameraModalProps> = ({
    open,
    onClose,
    onCapture,
    onError,
    variant = 'default',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
    const [videoReady, setVideoReady] = useState(false);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    useEffect(() => {
        if (open) {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
            const isAndroid = /android/i.test(userAgent);
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobileDevice(isIOS || isAndroid || isSmallScreen);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, cameraFacingMode]);

    const stopCamera = () => {
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            setActiveStream(null);
        }
        setVideoReady(false);
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            onError('Seu navegador não suporta acesso à câmera.');
            onClose();
            return;
        }

        try {
            const videoConstraints: MediaTrackConstraints = {
                facingMode: isMobileDevice ? { ideal: cameraFacingMode } : { ideal: 'user' },
                width: { ideal: 4096, min: 1280 },
                height: { ideal: 2160, min: 720 },
                aspectRatio: { ideal: isMobileDevice ? 9 / 16 : 16 / 9 },
            };

            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false,
            });

            setActiveStream(stream);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setVideoReady(true);
                };
            }
        } catch (err: any) {
            let errorMessage = 'Erro ao acessar a câmera. ';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Permissão negada.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'Nenhuma câmera encontrada.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'A câmera está sendo usada por outro aplicativo.';
            } else {
                errorMessage += 'Tente novamente.';
            }
            onError(errorMessage);
            onClose();
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current || !videoReady) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                        onClose();
                    } else {
                        onError('Erro ao processar a imagem.');
                    }
                },
                'image/jpeg',
                1.0
            );
        }
    };

    const handleSwitchCamera = () => {
        setCameraFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    };

    if (!open) return null;

    return (
        <Portal>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0, 0, 0, 0.95)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: { xs: 'min(95vw, 420px)', md: 'min(92vw, 980px)' },
                        aspectRatio: { xs: '9/16', md: '16/9' },
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: 'black',
                        boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {isMobileDevice && (
                        <Box
                            onClick={handleSwitchCamera}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(8px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'all 0.2s',
                                zIndex: 10,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                '&:active': { transform: 'scale(0.95)' },
                            }}
                        >
                            <CameraswitchIcon sx={{ fontSize: 22 }} />
                        </Box>
                    )}

                    <Box
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s',
                            zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            '&:active': { transform: 'scale(0.95)' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 24 }} />
                    </Box>

                    {variant === 'profile' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 4,
                            }}
                        >
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="xMidYMid slice"
                                aria-hidden="true"
                            >
                                <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.28)" />
                                <circle
                                    cx="50"
                                    cy="32"
                                    r="13"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.70)"
                                    strokeWidth="1.6"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path
                                    d="M22 86 C26 66 38 58 50 58 C62 58 74 66 78 86"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.55)"
                                    strokeWidth="1.6"
                                    vectorEffect="non-scaling-stroke"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M20 92 H80"
                                    stroke="rgba(255,255,255,0.25)"
                                    strokeWidth="1.2"
                                    vectorEffect="non-scaling-stroke"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </Box>
                    )}
                </Box>

                <Box
                    onClick={() => videoReady && handleCapture()}
                    sx={{
                        mt: 3,
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        border: '4px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: videoReady ? 'pointer' : 'not-allowed',
                        transition: 'transform 0.1s',
                        '&:active': { transform: 'scale(0.95)' },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            opacity: videoReady ? 1 : 0.8,
                        }}
                    />
                </Box>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
        </Portal>
    );
};

export default CameraModal;
