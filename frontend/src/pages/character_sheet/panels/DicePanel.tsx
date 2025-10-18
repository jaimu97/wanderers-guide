import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  NumberInput,
  TextInput,
  Menu,
  Badge,
  ScrollArea,
  Paper,
  ActionIcon,
  Title,
  Divider,
} from '@mantine/core';
import { useRecoilState } from 'recoil';
import { characterState } from '@atoms/characterAtoms';
import { useDebouncedValue, useDidUpdate } from '@mantine/hooks';
import { cloneDeep, groupBy } from 'lodash-es';
import { rollDie } from '@utils/random';
import { Dice } from '@typing/content';
import { IconArrowBigRightFilled, IconTrash, IconX } from '@tabler/icons-react';
import { sign } from '@utils/numbers';
import { useState, useRef, useEffect } from 'react';
import { findDefaultPresets } from '@common/dice/dice-utils';
import { openContextModal } from '@mantine/modals';

export default function DicePanel(props: { panelHeight: number; panelWidth: number }) {
  const [character, setCharacter] = useRecoilState(characterState);

  const [dice, setDice] = useState<Dice[]>([]);
  const [loadingRoll, setLoadingRoll] = useState(false);

  const [currentDiceNum, setCurrentDiceNum] = useState(1);
  const [currentDiceType, setCurrentDiceType] = useState('d20');
  const [currentDiceBonus, setCurrentDiceBonus] = useState(0);
  const [currentDiceLabel, setCurrentDiceLabel] = useState('');

  // Roll History //
  const rollHistoryViewport = useRef<HTMLDivElement>(null);
  const [rollHistory, setRollHistory] = useState(cloneDeep(character?.roll_history?.rolls ?? []));
  const groupedRolls = groupBy(
    rollHistory.map((r) => ({ ...r, group: `${r.label}~${r.timestamp}~${r.type}` })),
    (r) => r.group
  );
  const [debouncedRollHistory] = useDebouncedValue(rollHistory, 5000);
  useDidUpdate(() => {
    if (!character || !debouncedRollHistory) return;
    setCharacter({
      ...character,
      roll_history: {
        ...character.roll_history,
        rolls: debouncedRollHistory,
      },
    });
  }, [debouncedRollHistory]);

  useEffect(() => {
    rollHistoryViewport.current?.scrollTo({ top: 0 });
  }, [rollHistory]);

  // Presets //
  const [presets, setPresets] = useState(cloneDeep(character?.details?.dice?.presets ?? []));
  const [debouncedPresets] = useDebouncedValue(presets, 1000);
  useDidUpdate(() => {
    if (!character) return;
    setCharacter({
      ...character,
      details: {
        ...character.details,
        dice: {
          ...character.details?.dice,
          presets: debouncedPresets,
        },
      },
    });
  }, [debouncedPresets]);

  const defaultPresets = findDefaultPresets('CHARACTER', character);

  // Roll Dice //
  const onRollDice = async () => {
    setLoadingRoll(true);

    const results =
      dice.map((value) => ({
        type: value.type,
        label: value.label ?? '',
        result: rollDie(value.type),
        bonus: value.bonus,
      })) ?? [];

    setTimeout(() => {
      setLoadingRoll(false);
      const timestamp = Date.now();
      setRollHistory((prev) => [...prev, ...results.map((result) => ({ ...result, timestamp: timestamp }))]);
    }, 500);
    setDice([]);
  };

  const getRollHistory = () => {
    const numColor = 'gray.6';
    const mathColor = 'gray.7';
    const maxColor = 'green.5';
    const minColor = 'red.5';
    const resultColor = 'blue.5';

    const getRollEntry = (
      dice: {
        group: string;
        type: string;
        label: string;
        result: number;
        bonus: number;
        timestamp: number;
      }[]
    ) => {
      const dieType = parseInt(dice[0].type.slice(1));
      const bonus = dice.reduce((a, b) => a + b.bonus, 0);
      const result = dice.reduce((a, b) => a + b.result, 0) + bonus;
      return (
        <Group gap={5} wrap='wrap' align='start' style={{ overflow: 'hidden' }}>
          <Text span>
            <Text c={numColor} span>
              {dice.length}
            </Text>
            <Text c={mathColor} span>
              d
            </Text>
            <Text c={numColor} span>
              {dieType}
            </Text>
            <Text c={mathColor} span>
              {bonus !== 0 && (bonus > 0 ? '+' : '-')}
            </Text>
            <Text c={numColor} span>
              {bonus !== 0 && Math.abs(bonus)}
            </Text>
          </Text>
          <Text c={mathColor} span>
            <IconArrowBigRightFilled size='0.7rem' />
          </Text>
          <Text span style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%' }}>
            {dice.map((die, i) => (
              <Text key={i} span>
                <Text c={mathColor} span>
                  {`(`}
                </Text>
                <Text c={die.result === dieType ? maxColor : die.result === 1 ? minColor : numColor} span>
                  {die.result}
                </Text>
                <Text c={mathColor} span>
                  {`)`}
                </Text>
                <Text c={mathColor} span>
                  {dice.length - 1 !== i && '+'}
                </Text>
              </Text>
            ))}
            <Text c={mathColor} span>
              {bonus !== 0 && (bonus > 0 ? '+' : '-')}
            </Text>
            <Text c={numColor} span>
              {bonus !== 0 && Math.abs(bonus)}
            </Text>
          </Text>
          <Text c={mathColor} span>
            <IconArrowBigRightFilled size='0.7rem' />
          </Text>
          <Text span>
            <Text c={resultColor} fw={600} span>
              {result}
            </Text>
          </Text>
        </Group>
      );
    };

    return (
      <Stack gap={5}>
        {Object.keys(groupedRolls)
          .filter((group) => groupedRolls[group].length > 0)
          .sort((a, b) => groupedRolls[b][0].timestamp - groupedRolls[a][0].timestamp)
          .map((group, i) => (
            <Paper key={i} withBorder p={3} style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <Group justify='space-between' align='start' wrap='nowrap' pl={5} pr={10}>
                <Box>{getRollEntry(groupedRolls[group])}</Box>
                <Box>
                  <Stack gap={0} justify='space-between' align='end'>
                    <Text fz={8} c='gray.6' fs='italic' ta='end' style={{ whiteSpace: 'nowrap' }}>
                      {new Date(groupedRolls[group][0].timestamp).toLocaleTimeString()}
                    </Text>
                    <Text fz={10} c='gray.5' ta='end'>
                      {groupedRolls[group][0].label}
                    </Text>
                  </Stack>
                </Box>
              </Group>
            </Paper>
          ))}
      </Stack>
    );
  };

  const getPresetEntry = (preset: { id: string; name: string; dice: Dice[] }, includeDelete: boolean) => {
    return (
      <Paper withBorder p={3} style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <Group justify='space-between' align='center' wrap='nowrap' px={5}>
          <Group wrap='nowrap' gap={10}>
            <Text fz='sm'>{preset.name}</Text>
          </Group>

          <Group align='center' wrap='nowrap' px={5}>
            <Badge variant='outline' color='gray.7' size='xs' circle>
              {preset.dice.length}
            </Badge>
            <Group gap={5} justify='space-between' align='end' wrap='nowrap'>
              <Button
                size='compact-xs'
                onClick={() => {
                  setDice((prev) => [
                    ...prev,
                    ...preset.dice.map((die) => ({
                      ...die,
                      id: crypto.randomUUID(),
                    })),
                  ]);
                }}
              >
                Add to tray
              </Button>
              {includeDelete && (
                <ActionIcon
                  variant='subtle'
                  aria-label='Delete Preset'
                  size='sm'
                  radius={'xl'}
                  color='gray.6'
                  onClick={() => {
                    setPresets((prev) => prev.filter((p) => p.id !== preset.id));
                  }}
                >
                  <IconTrash style={{ width: '60%', height: '60%' }} stroke={1.5} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        </Group>
      </Paper>
    );
  };

  const leftPanelHeight = Math.min(Math.max(props.panelHeight - 140, 200), 300);
  const rightPanelHeight = Math.min(Math.max(props.panelHeight - 100, 200), 350);

  return (
    <Group align='start' wrap='wrap' gap='md'>
      {/* Left Side - Roller & History */}
      <Box style={{ flex: 1 }}>
        <Stack gap={10}>
          {/* Dice Input */}
          <Group wrap='nowrap' justify='center' align='start'>
            <Stack gap={5}>
              <Group wrap='nowrap' justify='center' gap={10}>
                <Button.Group>
                  <Menu shadow='md' width={50}>
                    <Menu.Target>
                      <Button variant='default' w={50}>
                        {currentDiceNum}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {Array.from({ length: 10 }, (_, i) => (
                        <Menu.Item key={i} onClick={() => setCurrentDiceNum(i + 1)}>
                          <Text ta='center'>{i + 1}</Text>
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                  <Menu shadow='md' width={65}>
                    <Menu.Target>
                      <Button variant='default' w={65}>
                        {currentDiceType}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => setCurrentDiceType('d4')}>
                        <Text ta='center'>d4</Text>
                      </Menu.Item>
                      <Menu.Item onClick={() => setCurrentDiceType('d6')}>
                        <Text ta='center'>d6</Text>
                      </Menu.Item>
                      <Menu.Item onClick={() => setCurrentDiceType('d8')}>
                        <Text ta='center'>d8</Text>
                      </Menu.Item>
                      <Menu.Item onClick={() => setCurrentDiceType('d10')}>
                        <Text ta='center'>d10</Text>
                      </Menu.Item>
                      <Menu.Item onClick={() => setCurrentDiceType('d12')}>
                        <Text ta='center'>d12</Text>
                      </Menu.Item>
                      <Menu.Item onClick={() => setCurrentDiceType('d20')}>
                        <Text ta='center'>d20</Text>
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Button.Group>
                <Text>+</Text>
                <NumberInput
                  hideControls
                  placeholder='0'
                  w={50}
                  value={currentDiceBonus || ''}
                  onChange={(value) => {
                    const parsed = parseInt(`${value}`);
                    setCurrentDiceBonus(isNaN(parsed) ? 0 : parsed);
                  }}
                />
                <Box pl={5}>
                  <Button
                    size='xs'
                    variant='filled'
                    radius={'xl'}
                    onClick={() => {
                      const newDice: Dice[] = [];
                      const bonus = isNaN(currentDiceBonus) ? 0 : currentDiceBonus;
                      for (let i = 0; i < currentDiceNum; i++) {
                        newDice.push({
                          id: crypto.randomUUID(),
                          type: currentDiceType,
                          theme: '',
                          bonus: i === currentDiceNum - 1 ? bonus : 0,
                          label: currentDiceLabel,
                        });
                      }
                      setDice([...dice, ...newDice]);
                      setCurrentDiceNum(1);
                      setCurrentDiceBonus(0);
                      setCurrentDiceLabel('');
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Group>
              <i>
                <TextInput
                  pl={2}
                  variant='unstyled'
                  size='xs'
                  placeholder='Roll label or description'
                  value={currentDiceLabel}
                  onChange={(e) => setCurrentDiceLabel(e.currentTarget.value)}
                />
              </i>
            </Stack>
          </Group>

          {/* Dice Tray */}
          <Paper withBorder p={5}>
            <ScrollArea h={80} type='always' scrollbars='y'>
              <Group gap={10}>
                {dice.map((die, i) => (
                  <Badge
                    key={i}
                    color='gray.4'
                    variant='light'
                    size='lg'
                    styles={{
                      root: {
                        textTransform: 'initial',
                        userSelect: 'none',
                      },
                    }}
                    p={0}
                    rightSection={
                      <ActionIcon
                        variant='subtle'
                        color='gray'
                        size='sm'
                        aria-label='Remove Dice'
                        onClick={(e) => {
                          e.stopPropagation();
                          setDice(dice.filter((_, index) => index !== i));
                        }}
                      >
                        <IconX style={{ width: '70%', height: '70%' }} stroke={1.5} />
                      </ActionIcon>
                    }
                  >
                    {die.type}
                    {die.bonus ? `${sign(die.bonus)}` : ''}
                  </Badge>
                ))}
                {dice.length === 0 && (
                  <Text w='100%' py='xs' fz='xs' c='gray.7' ta='center' fs='italic'>
                    Dice tray - Add some dice to roll
                  </Text>
                )}
              </Group>
            </ScrollArea>
          </Paper>

          <Button
            size='compact-sm'
            fullWidth
            loading={loadingRoll}
            disabled={dice.length === 0}
            onClick={() => {
              onRollDice();
            }}
          >
            Roll Dice
          </Button>

          <Divider />

          {/* History */}
          <Group justify='space-between'>
            <Title order={5}>History</Title>
            {rollHistory.length > 0 && (
              <ActionIcon
                variant='subtle'
                aria-label='Clear History'
                size='sm'
                radius={'xl'}
                color='gray.9'
                onClick={() => {
                  setRollHistory([]);
                }}
              >
                <IconTrash style={{ width: '60%', height: '60%' }} stroke={1.5} />
              </ActionIcon>
            )}
          </Group>
          <Box>
            <ScrollArea h={leftPanelHeight} scrollbars='y' viewportRef={rollHistoryViewport}>
              {rollHistory.length > 0 ? (
                getRollHistory()
              ) : (
                <Text w='100%' py='md' fz='sm' c='gray.7' ta='center' fs='italic'>
                  No roll history yet
                </Text>
              )}
            </ScrollArea>
          </Box>
        </Stack>
      </Box>

      {/* Right Side - Presets */}
      <Box style={{ flex: 1 }}>
        <Stack gap={10}>
          <Group wrap='nowrap' justify='space-between'>
            <Title order={5}>Presets</Title>
            {dice.length > 0 && (
              <Button
                size='compact-xs'
                variant='light'
                onClick={() => {
                  openContextModal({
                    modal: 'createDicePreset',
                    title: <Title order={3}>Create Preset</Title>,
                    innerProps: {
                      onConfirm: (name: string) => {
                        setPresets((prev) => [
                          ...prev,
                          {
                            id: crypto.randomUUID(),
                            name: name,
                            dice: dice,
                          },
                        ]);
                      },
                    },
                  });
                }}
              >
                Save tray to preset
              </Button>
            )}
          </Group>

          <ScrollArea h={rightPanelHeight / 2 - 30} scrollbars='y'>
            <Stack gap={5}>
              {cloneDeep(presets)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((preset, i) => (
                  <Box key={i}>{getPresetEntry(preset, true)}</Box>
                ))}
              {presets.length === 0 && (
                <Text w='100%' pt='xs' fz='xs' c='gray.7' ta='center' fs='italic'>
                  No custom presets found.
                </Text>
              )}
            </Stack>
          </ScrollArea>

          <Divider label='Default Presets' labelPosition='center' />

          <ScrollArea h={rightPanelHeight / 2 - 10} scrollbars='y'>
            <Stack gap={5}>
              {defaultPresets.map((preset, i) => (
                <Box key={i}>{getPresetEntry(preset, false)}</Box>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Box>
    </Group>
  );
}
