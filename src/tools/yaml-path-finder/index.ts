import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'YAML PATH FINDER',
  path: '/yaml-path-finder',
  description: 'Use this tool to track down a particular path within a YAML file. Put your YAML on the left, and enter your key on the right.',
  keywords: ['yaml', 'path', 'finder'],
  component: () => import('./yaml-path-finder.vue'),
  icon: ArrowsShuffle,
  createdAt: new Date('2024-12-21'),
});
