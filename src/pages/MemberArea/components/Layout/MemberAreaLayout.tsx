import React from 'react';
import { Outlet } from 'react-router-dom';
import MemberAreaShell from './MemberAreaShell';

/** Rota-layout: toda subpágina (e subpágina de subpágina) renderiza dentro da casca. */
const MemberAreaLayout: React.FC = () => (
  <MemberAreaShell>
    <Outlet />
  </MemberAreaShell>
);

export default MemberAreaLayout;
