import React, { useState } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import {
  Person,
  Palette,
  Notifications,
  Security,
  Api,
  Psychology,
} from '@mui/icons-material';
import ProfileSettings from '../components/Settings/ProfileSettings';
import ApiSettings from '../components/Settings/ApiSettings';
import SettingsPanel from '../components/Settings/SettingsPanel';
import SystemPromptSettings from '../components/Settings/SystemPromptSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 100px)' }}>
      <Paper sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          orientation="horizontal"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexShrink: 0,
          }}
        >
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Palette />} label="Appearance" />
          <Tab icon={<Psychology />} label="AI Prompts" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Api />} label="API Keys" />
        </Tabs>

        <Box sx={{ 
          p: 3, 
          overflow: 'auto',
          flex: 1,
          height: 0 // Это заставляет flex item уменьшаться
        }}>
          <TabPanel value={activeTab} index={0}>
            <ProfileSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <SettingsPanel type="appearance" />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <SystemPromptSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <SettingsPanel type="notifications" />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <SettingsPanel type="security" />
          </TabPanel>
          <TabPanel value={activeTab} index={5}>
            <ApiSettings />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;