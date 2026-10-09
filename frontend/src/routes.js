import React from 'react';
import { Route } from 'react-router-dom';
// import Message from './pages/message';
// import My from './pages/my';
import Config from './pages/config';
import Login from './pages/login';
import Floorplan from './pages/floorplan';

const AppRoutes = ({sidebarVisible, setSidebarVisible}) => [
  // <Route key="message" path="/message" element={<Message />} />,
  // <Route key="my" path="/my" element={<My />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="config" path="/config" element={<Config sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />} />,
  <Route key="floorplan" path="/floorplan" element={<Floorplan />} />
];

export default AppRoutes; 