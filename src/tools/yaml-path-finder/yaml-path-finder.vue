<script setup lang="ts">
import { computed, ref } from 'vue';
import YAML from 'yaml';
import { propertyOf } from 'underscore';
import { diffChars } from 'diff';

const defaultYaml = `hello:
  from:
    your:
      favourite:
        yaml:
          tool: 👋
`;

const parsedDefaultYaml = YAML.parse(defaultYaml.trim());

function getDeepKeys(obj: any): Array<string> {
  let keys: Array<string> = [];
  for (const key in obj) {
    keys.push(key);
    if (typeof obj[key] === 'object') {
      const subkeys = getDeepKeys(obj[key]);
      keys = keys.concat(
        subkeys.map(subkey => `${key}.${subkey}`),
      );
    }
  }
  return keys;
}

const parsedYaml = ref(parsedDefaultYaml);
const keys = ref<Array<string>>(getDeepKeys(parsedDefaultYaml));
const search = ref('');
const comparison = ref('');
const yamlInput = ref(defaultYaml);

function updateYaml() {
  if (yamlInput.value) {
    try {
      const loadedYaml = YAML.parse(yamlInput.value);
      parsedYaml.value = loadedYaml;
      keys.value = getDeepKeys(loadedYaml);
    }
    catch (error) {
      console.error('Failed to parse YAML:', error);
    }
  }
}

function renderComparison(foundValue: string): string {
  if (foundValue === comparison.value) {
    return '<span class="text-success">Values match! 🎉</span>';
  }

  return diffChars(foundValue, comparison.value)
    .map(({ added, removed, value }) => {
      if (removed) { return `<span class="text-error">${value}</span>`; }
      if (added) { return `<span class="text-success">${value}</span>`; }
      return `<span>${value}</span>`;
    })
    .join('');
}

function exactMatch(parts: Array<string>) {
  const foundValue = propertyOf(parsedYaml.value)(parts);
  if (foundValue) {
    return {
      path: parts.join('.'),
      value: JSON.stringify(foundValue, null, 2),
    };
  }
  return null;
}

function prefixMatch(value: string) {
  const foundKeys = keys.value.filter(key => key.startsWith(value));
  if (foundKeys.length === 0) {
    return null;
  }

  return {
    count: foundKeys.length,
    keys: foundKeys,
  };
}

function suffixMatch(value: string) {
  const foundKeys = keys.value.filter(key => key.endsWith(value));
  if (foundKeys.length === 0) {
    return null;
  }

  return {
    count: foundKeys.length,
    keys: foundKeys,
  };
}

const searchResult = computed(() => {
  if (!search.value) { return null; }

  const exact = exactMatch(search.value.split('.'));
  if (exact) { return { type: 'exact', ...exact }; }

  const suffix = suffixMatch(search.value);
  if (suffix) { return { type: 'suffix', ...suffix }; }

  const prefix = prefixMatch(search.value);
  if (prefix) { return { type: 'prefix', ...prefix }; }

  return { type: 'none' };
});
</script>

<template>
  <n-grid :cols="2" :x-gap="24">
    <n-grid-item>
      <n-space vertical>
        <text strong>
          YAML goes here
        </text>
        <n-input
          v-model:value="yamlInput"
          type="textarea"
          :autosize="{ minRows: 10 }"
          @blur="updateYaml"
        />
      </n-space>
    </n-grid-item>

    <n-grid-item>
      <n-space vertical>
        <text strong>
          Find by a key (example: "hello.from")
        </text>
        <text depth="3" italic>
          You can also search by prefix or suffix: (try: "hello" or "tool")
        </text>
        <n-input
          v-model:value="search"
          placeholder="Find a key"
        />

        <template v-if="searchResult">
          <n-card v-if="searchResult.type === 'exact'">
            <n-space vertical>
              <text type="success">
                Found a value at path: <code>{{ searchResult?.path }}</code>
              </text>
              <pre class="rounded bg-gray-100 p-4">
                  <code>{{ searchResult.value }}</code>
                </pre>

              <text>Compare your path here:</text>
              <n-input
                v-model:value="comparison"
                placeholder="Compare a key"
              />
              <pre
                class="rounded bg-gray-100 p-4 font-bold"
                v-html="renderComparison(searchResult.path)"
              />
            </n-space>
          </n-card>

          <n-card v-else-if="searchResult.type === 'prefix' || searchResult.type === 'suffix'">
            <n-space vertical>
              <n-gradient-text type="success">
                Found {{ searchResult.count }} keys {{ searchResult.type === 'prefix' ? 'beginning' : 'ending' }} with: {{ search }}
              </n-gradient-text>
              <template v-for="key in searchResult.keys" :key="key">
                <n-text type="success">
                  Found a value at path:<n-code>{{ key }}</n-code>
                </n-text>
                <n-text class="rounded bg-gray-100 p-4" tag="div">
                  {{ JSON.stringify(propertyOf(parsedYaml)(key.split('.')), null, 2) }}
                </n-text>
              </template>
            </n-space>
          </n-card>

          <n-card v-else>
            <n-space vertical>
              <n-gradient-text type="error">
                Could not find anything for: {{ search }}. We tried:
              </n-gradient-text>
              <n-list>
                <n-list-item>Keys that were exactly {{ search }}</n-list-item>
                <n-list-item>Keys ending with {{ search }}</n-list-item>
                <n-list-item>Keys beginning with {{ search }}</n-list-item>
              </n-list>
            </n-space>
          </n-card>
        </template>
      </n-space>
    </n-grid-item>
  </n-grid>
</template>

<style scoped>
</style>
