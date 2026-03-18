import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

let _client: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient {
  if (!_client) {
    _client = new ElevenLabsClient();
  }
  return _client;
}

// Japanese voice — you can change this to any voice ID
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const AUDIO_DIR = process.env.AUDIO_DIR || "./data/audio";

async function ensureAudioDir() {
  await mkdir(AUDIO_DIR, { recursive: true });
}

/**
 * Generate audio for a Japanese text and save to file.
 * Returns the relative file path.
 */
export async function generateAudio(text: string, filename: string): Promise<string> {
  if (process.env.USE_MOCK_AI === "true" || process.env.USE_MOCK_AUDIO === "true") {
    return `/mock-audio/${filename}.mp3`;
  }

  await ensureAudioDir();

  const audioStream = await getClient().textToSpeech.convert(VOICE_ID, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const filePath = join(AUDIO_DIR, `${filename}.mp3`);
  await Bun.write(filePath, buffer);

  return filePath;
}

/**
 * Generate audio for both the word and its example sentence.
 */
export async function generateCardAudio(
  nodeId: string,
  surface: string,
  sentence: string | null
): Promise<{ audioWord: string; audioSentence: string | null }> {
  const audioWord = await generateAudio(surface, `${nodeId}_word`);
  const audioSentence = sentence
    ? await generateAudio(sentence, `${nodeId}_sentence`)
    : null;

  return { audioWord, audioSentence };
}
