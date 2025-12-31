// src/pages/shelters/components/ShelterPeopleCarouselCard.tsx
import React, { useCallback, useState } from 'react';
import { Avatar, Card, CardContent, IconButton, Typography } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Groups as GroupsIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getInitials2, makeImgErrorHandler, safeImgUrl } from './utils';


type Person = {
  id: string;
  user: { name?: string | null; mediaItem?: { url?: string | null } | null };
};

type Props = {
  title: string;
  count: number;
  theme: 'blue' | 'purple';
  icon: React.ReactNode; // PersonOutline ou SchoolOutlined
  people: Person[];
  getTeams: (id: string) => number[];
};

export default function ShelterPeopleCarouselCard({ title, count, theme, icon, people, getTeams }: Props) {
  const [scrollerRef, setScrollerRef] = useState<HTMLDivElement | null>(null);

  const scrollCards = useCallback((direction: 'left' | 'right') => {
    if (!scrollerRef) return;

    const firstCard = scrollerRef.querySelector<HTMLElement>('.shelterPage__miniCard');
    const cardWidth = firstCard?.getBoundingClientRect().width || 260;

    const styles = getComputedStyle(scrollerRef);
    const gap = parseFloat(styles.columnGap || styles.gap || '12') || 12;

    const step = cardWidth + gap;
    const maxScroll = scrollerRef.scrollWidth - scrollerRef.clientWidth;

    const next =
      direction === 'left'
        ? Math.max(0, scrollerRef.scrollLeft - step)
        : Math.min(maxScroll, scrollerRef.scrollLeft + step);

    scrollerRef.scrollTo({ left: next, behavior: 'smooth' });
  }, [scrollerRef]);

  if (!people?.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className={`shelterPage__card shelterPage__card--${theme}`} elevation={4}>
        <CardContent className="shelterPage__cardPadRight">
          <div className={`shelterPage__sectionHeader shelterPage__sectionHeader--${theme}`}>
            <div className={`shelterPage__sectionIconBox shelterPage__sectionIconBox--${theme}`}>{icon}</div>
            <Typography variant="h6" className={`shelterPage__sectionTitle shelterPage__sectionTitle--${theme}`}>
              {title} ({count})
            </Typography>
          </div>

          <div className="shelterPage__scrollerWrap">
            {/* ⬅️ aparece no mobile também */}
            {people.length > 1 ? (
              <IconButton
                aria-label="Anterior"
                onClick={() => scrollCards('left')}
                className={`shelterPage__scrollBtn shelterPage__scrollBtn--left shelterPage__scrollBtn--${theme}`}
              >
                <ChevronLeftIcon className="shelterPage__scrollIcon" />
              </IconButton>
            ) : null}

            <div ref={setScrollerRef} className={`shelterPage__scroller shelterPage__scroller--${theme}`}>
              {people.map((p) => {
                const name = p.user?.name || 'Sem nome';
                const img = safeImgUrl(p.user?.mediaItem?.url);
                const teams = getTeams(p.id);

                return (
                  <Card key={p.id} className={`shelterPage__miniCard shelterPage__miniCard--${theme}`} elevation={2}>
                    <div className={`shelterPage__miniHead shelterPage__miniHead--${theme}`}>
                      <Avatar
                        src={img}
                        alt={name}
                        className={`shelterPage__avatar shelterPage__avatar--${theme}`}
                        imgProps={{ onError: makeImgErrorHandler() }}
                      >
                        {getInitials2(name) || (theme === 'blue' ? 'L' : 'M')}
                      </Avatar>
                    </div>

                    <div className="shelterPage__miniBody">
                      <Typography variant="body1" className="shelterPage__miniName">
                        {name}
                      </Typography>

                      {teams.length > 0 ? (
                        <div className={`shelterPage__miniTeams shelterPage__miniTeams--${theme}`}>
                          <GroupsIcon className={`shelterPage__miniTeamsIcon shelterPage__miniTeamsIcon--${theme}`} />
                          <Typography variant="caption" className={`shelterPage__miniTeamsText shelterPage__miniTeamsText--${theme}`}>
                            {teams.length === 1 ? `Equipe ${teams[0]}` : `Equipes: ${teams.join(', ')}`}
                          </Typography>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ➡️ aparece no mobile também */}
            {people.length > 1 ? (
              <IconButton
                aria-label="Próximo"
                onClick={() => scrollCards('right')}
                className={`shelterPage__scrollBtn shelterPage__scrollBtn--right shelterPage__scrollBtn--${theme}`}
              >
                <ChevronRightIcon className="shelterPage__scrollIcon" />
              </IconButton>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
