import React, { Fragment, useEffect, useRef, useState } from 'react';
import { gradients } from '@/theme';
import { Box, Container, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/slices';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import api from '@/config/axiosConfig';
import { setEvents } from '@/store/slices/events/eventsSlice';
import EventDetailsModal from './EventDetailsModal';
import EventFormModal from './EventFormModal';
import { UserRole } from '@/store/slices/auth/authSlice';
import { motion } from 'framer-motion';

// Refactored Imports
import { createEventArrangement } from './utils/eventUtils';
import LoadingState from './components/LoadingState';
import EventsHeader from './components/EventsHeader';
import EmptyState from './components/EmptyState';
import EventList from './components/EventList';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import { Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

dayjs.locale('pt-br');

const Eventos: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth) as any;
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarAntigos, setMostrarAntigos] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<any | null>(null);

  const [dialogAddEditOpen, setDialogAddEditOpen] = useState(false);
  const [dialogAddEditMode, setDialogAddEditMode] = useState<'add' | 'edit'>('add');
  const [currentEditEvent, setCurrentEditEvent] = useState<any | null>(null);

  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<any | null>(null);

  const eventosAntigosRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await api.get('/events');
        const raw = response.data || [];

        const mapped = raw.map((e: any) => {
          const hasDate = e?.date && String(e.date).trim();
          const fallback = e?.media?.createdAt || e?.createdAt || null;
          return {
            ...e,
            date: hasDate ? e.date : fallback,
          };
        });
        dispatch(setEvents(mapped));
        setEventos(mapped);
      } catch {
        // catch error silently as per original code
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, [dispatch]);

  useEffect(() => {
    if (mostrarAntigos && eventosAntigosRef.current) {
      setTimeout(() => {
        eventosAntigosRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [mostrarAntigos]);

  const eventosOrdenados = [...eventos].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );

  const arrangement = createEventArrangement(eventosOrdenados);

  const handleAddNewEvent = () => {
    setDialogAddEditMode('add');
    setCurrentEditEvent(null);
    setDialogAddEditOpen(true);
  };

  const handleEditEvent = (evento: any) => {
    setDialogAddEditMode('edit');
    setCurrentEditEvent(evento);
    setDialogAddEditOpen(true);
  };

  const handleDeleteEvent = (evento: any) => {
    setDeleteTargetEvent(evento);
    setDialogDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetEvent) return;
    try {
      await api.delete(`/events/${deleteTargetEvent.id}`);
      setDialogDeleteOpen(false);
      setDeleteTargetEvent(null);
      await reloadEventsAndLeaveEditMode();
    } catch {
      // catch error silently as per original code
    }
  };

  const handleCloseDelete = () => {
    setDialogDeleteOpen(false);
    setDeleteTargetEvent(null);
  };

  const reloadEventsAndLeaveEditMode = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events');
      const raw = response.data || [];
      const mapped = raw.map((e: any) => {
        const hasDate = e?.date && String(e.date).trim();
        const fallback = e?.media?.createdAt || e?.createdAt || null;
        return {
          ...e,
          date: hasDate ? e.date : fallback,
        };
      });
      dispatch(setEvents(mapped));
      setEventos(mapped);
    } catch {
      // catch error silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const naoTemEventos = !eventos.length;

  return (
    <Fragment>
      <Box
        sx={{
          minHeight: '100vh',
          background: gradients.subtle.greenWhiteSoft,
        }}
      >
        <EventsHeader isAdmin={isAdmin} onAddEvent={handleAddNewEvent} />

        <Box sx={{
          width: '95%',
          maxWidth: '1600px',
          mx: 'auto',
          py: { xs: 4, md: 6 },
          px: { xs: 0.5, md: 1 }
        }}>
          {naoTemEventos ? (
            <EmptyState isAdmin={isAdmin} onAddEvent={handleAddNewEvent} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {isMobile && isAdmin && (
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    zIndex: 9999,
                  }}
                >
                  <Tooltip title="Adicionar Evento">
                    <Fab
                      color="primary"
                      aria-label="adicionar"
                      onClick={handleAddNewEvent}
                      size="medium"
                      sx={{
                        width: { xs: 48, md: 56 },
                        height: { xs: 48, md: 56 },
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <AddIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
                    </Fab>
                  </Tooltip>
                </Box>
              )}

              <EventList
                arrangement={arrangement}
                isAdmin={isAdmin}
                mostrarAntigos={mostrarAntigos}
                setMostrarAntigos={setMostrarAntigos}
                eventosAntigosRef={eventosAntigosRef}
                onViewDetails={setEventoSelecionado}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            </motion.div>
          )}
        </Box>

        {eventoSelecionado && (
          <EventDetailsModal
            open={!!eventoSelecionado}
            onClose={() => setEventoSelecionado(null)}
            event={eventoSelecionado}
          />
        )}

        <EventFormModal
          open={dialogAddEditOpen}
          onClose={() => setDialogAddEditOpen(false)}
          onSuccess={reloadEventsAndLeaveEditMode}
          mode={dialogAddEditMode}
          initialData={currentEditEvent}
        />

        <DeleteConfirmationModal
          open={dialogDeleteOpen}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          loading={false}
          description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        />
      </Box>
    </Fragment>
  );
};

export default Eventos;
