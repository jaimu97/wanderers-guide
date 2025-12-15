import BlurBox from '@common/BlurBox';
import { Center, Group, Title, Button, Text, Stack } from '@mantine/core';
import { showNotification, hideNotification } from '@mantine/notifications';
import { makeRequest } from '@requests/request-manager';
import { Character } from '@typing/content';
import exportToJSON from '@export/export-to-json';
import { useState } from 'react';

export default function DumpCharacters() {
  const [loading, setLoading] = useState(false);

  const handleDumpCharacters = async () => {
    setLoading(true);
    
    showNotification({
      id: 'dump-characters-loading',
      title: 'Fetching all characters',
      message: 'Please wait...',
      autoClose: false,
      withCloseButton: false,
      loading: true,
    });

    try {
      const characters = await makeRequest<Character[]>('find-character', {});
      
      hideNotification('dump-characters-loading');

      if (!characters || characters.length === 0) {
        showNotification({
          id: 'dump-characters-error',
          title: 'No characters found',
          message: 'No characters were found in the database.',
          color: 'yellow',
          autoClose: 5000,
        });
        setLoading(false);
        return;
      }

      showNotification({
        id: 'dump-characters-exporting',
        title: `Exporting ${characters.length} characters`,
        message: 'Downloads will start shortly. This may take a moment...',
        autoClose: false,
        withCloseButton: false,
        loading: true,
      });

      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        await exportToJSON(character);
        
        if (i < characters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      hideNotification('dump-characters-exporting');
      
      showNotification({
        id: 'dump-characters-success',
        title: 'Export complete',
        message: `Successfully exported ${characters.length} characters!`,
        color: 'green',
        autoClose: 5000,
      });
    } catch (error) {
      hideNotification('dump-characters-loading');
      hideNotification('dump-characters-exporting');
      
      showNotification({
        id: 'dump-characters-error',
        title: 'Export failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        color: 'red',
        autoClose: 5000,
      });
      
      console.error('Error dumping characters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlurBox p='sm'>
      <Center p='sm'>
        <Stack gap='xs'>
          <Group>
            <Title order={3}>Dump Characters</Title>
            <Button
              loading={loading}
              onClick={handleDumpCharacters}
              color='brown'
            >
              Take a dump
            </Button>
          </Group>
        </Stack>
      </Center>
    </BlurBox>
  );
}
