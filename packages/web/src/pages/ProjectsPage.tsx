import React from 'react';
import { Container } from '@mui/material';
import ProjectList from '../components/Projects/ProjectList';

const ProjectsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ height: '100%', overflow: 'auto' }}>
      <ProjectList />
    </Container>
  );
};

export default ProjectsPage;