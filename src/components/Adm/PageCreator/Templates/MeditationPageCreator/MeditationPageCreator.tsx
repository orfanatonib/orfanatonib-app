import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AxiosError } from 'axios';
import { Grid, Paper, Typography } from '@mui/material';
import api from '@/config/axiosConfig';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import {
  clearMeditationData,
  clearMedia,
  DayItem,
} from '@/store/slices/meditation/meditationSlice';
import { MediaPlatform, MediaUploadType } from 'store/slices/types';
import { logger } from '@/utils/logger';
import MeditationForm from './MeditationForm';
import MediaManager from './MediaManager';
import {
  MEDITATIONS_ENDPOINT,
  MEDITATIONS_LIST_PATH,
  MEDITATION_MESSAGES,
  MEDITATION_PAGE_TEST_ID,
} from './constants';
import { buildMeditationFormData, validateMeditation } from './utils';
import PageFormBase from '../shared/PageFormBase';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import TouchedTextField from '../shared/TouchedTextField';
import { BASIC_INFO_HEADING } from '../shared/constants';
import { PAGE_PAPER_SX } from '../shared/styles';
import { FeedbackSeverity } from '../shared/types';

interface Props {
  fromTemplatePage?: boolean;
}

const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' };

export default function MeditationPageCreator({ fromTemplatePage }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const meditationData = useSelector((state: RootState) => state.meditation.meditationData);

  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<MediaUploadType>(MediaUploadType.LINK);
  const [url, setUrl] = useState('');
  const [platformType, setPlatformType] = useState<MediaPlatform>(MediaPlatform.ANY);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ topic: false, startDate: false, endDate: false });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: FeedbackSeverity }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearMeditationData());
      dispatch(clearMedia());
      setTopic('');
      setFile(null);
      setUploadType(MediaUploadType.LINK);
      setUrl('');
      setPlatformType(MediaPlatform.ANY);
      setStartDate('');
      setEndDate('');
      setDays([]);
    }
  }, [fromTemplatePage, dispatch]);

  useEffect(() => {
    if (!fromTemplatePage && meditationData) {
      setTopic(meditationData.topic);
      setStartDate(meditationData.startDate);
      setEndDate(meditationData.endDate);
      setDays(meditationData.days);
      if (meditationData.media) {
        setUploadType(meditationData.media.uploadType);
        setUrl(meditationData.media.url ?? '');
        setPlatformType(meditationData.media.platformType ?? MediaPlatform.ANY);
      }
    }
  }, [fromTemplatePage, meditationData]);

  const setTouchedField = (field: keyof typeof touched) => (value: boolean) =>
    setTouched((prev) => ({ ...prev, [field]: value }));

  const notify = (message: string, severity: FeedbackSeverity) =>
    setSnackbar({ open: true, message, severity });

  const handleSave = async () => {
    setTouched({ topic: true, startDate: true, endDate: true });
    const draft = { topic, startDate, endDate, days, uploadType, url, file, platformType };
    const problem = validateMeditation(draft);
    if (problem) return notify(problem, 'error');

    setLoading(true);
    try {
      const formData = buildMeditationFormData(draft, Boolean(fromTemplatePage), meditationData?.id);
      if (fromTemplatePage) {
        await api.post(MEDITATIONS_ENDPOINT, formData, { headers: MULTIPART_HEADERS });
      } else {
        await api.patch(`${MEDITATIONS_ENDPOINT}/${meditationData?.id}`, formData, {
          headers: MULTIPART_HEADERS,
        });
      }

      await dispatch(fetchRoutes());
      notify(MEDITATION_MESSAGES.SAVED, 'success');
      navigate(MEDITATIONS_LIST_PATH);
    } catch (error) {
      if (error instanceof AxiosError) return;
      logger.error('Falha inesperada na operação', undefined, error);
      notify(MEDITATION_MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFormBase
      testId={MEDITATION_PAGE_TEST_ID}
      heading={fromTemplatePage ? MEDITATION_MESSAGES.CREATE_HEADING : MEDITATION_MESSAGES.EDIT_HEADING}
      onBack={() => navigate(-1)}
    >
      <Paper elevation={2} sx={PAGE_PAPER_SX}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          {BASIC_INFO_HEADING}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TouchedTextField
              testId={`${MEDITATION_PAGE_TEST_ID}-topic-input`}
              label={MEDITATION_MESSAGES.TOPIC_LABEL}
              value={topic}
              touched={touched.topic}
              onChange={setTopic}
              onTouchedChange={setTouchedField('topic')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TouchedTextField
              testId={`${MEDITATION_PAGE_TEST_ID}-start-input`}
              label={MEDITATION_MESSAGES.START_LABEL}
              type="date"
              trimValue={false}
              value={startDate}
              touched={touched.startDate}
              onChange={setStartDate}
              onTouchedChange={setTouchedField('startDate')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TouchedTextField
              testId={`${MEDITATION_PAGE_TEST_ID}-end-input`}
              label={MEDITATION_MESSAGES.END_LABEL}
              type="date"
              trimValue={false}
              value={endDate}
              touched={touched.endDate}
              onChange={setEndDate}
              onTouchedChange={setTouchedField('endDate')}
            />
          </Grid>
          <Grid item xs={12}>
            <MediaManager
              uploadType={uploadType}
              setUploadType={setUploadType}
              file={file}
              setFile={setFile}
              url={url}
              setUrl={setUrl}
              platformType={platformType}
              setPlatformType={setPlatformType}
            />
          </Grid>
        </Grid>
      </Paper>

      <MeditationForm days={days} onDaysChange={setDays} />

      <PageFormActions
        testId={MEDITATION_PAGE_TEST_ID}
        saveLabel={MEDITATION_MESSAGES.SAVE}
        savingLabel={MEDITATION_MESSAGES.SAVING}
        saveColor="primary"
        isSaving={loading}
        savingSpinner
        onCancel={() => navigate(-1)}
        onSave={handleSave}
      />

      <PageFeedbackSnackbar
        testId={`${MEDITATION_PAGE_TEST_ID}-feedback`}
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        filled
        showCloseButton={false}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </PageFormBase>
  );
}
