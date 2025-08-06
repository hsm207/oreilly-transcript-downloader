import { describe, it, expect } from "vitest";
import { preprocessVttToTranscript } from "./LiveEventTranscriptProcessingRules";

const sampleVtt = `WEBVTT

NOTE language:en-US

NOTE Confidence: 0.6730711460113525

00:00:00.040 --> 00:00:03.720
Everyone and welcome to writing effective prompts for Chachi GPT.

NOTE Confidence: 0.7185882329940796

00:00:04.080 --> 00:00:06.968
I am Andrew Eric with Riley Media, and I will

NOTE Confidence: 0.7185882329940796

00:00:07.032 --> 00:00:09.599
be your facilitator for today's session.

NOTE Confidence: 0.7536457777023315

00:00:10.080 --> 00:00:13.000
Our instructor for today's course is Sarah Tamsin.

NOTE Confidence: 0.86326003074646

00:00:13.720 --> 00:00:16.782
A quick reminder of a couple of best practices before
`;

const expectedTxt = `00:00:00.040 --> 00:00:03.720: Everyone and welcome to writing effective prompts for Chachi GPT.
00:00:04.080 --> 00:00:06.968: I am Andrew Eric with Riley Media, and I will
00:00:07.032 --> 00:00:09.599: be your facilitator for today's session.
00:00:10.080 --> 00:00:13.000: Our instructor for today's course is Sarah Tamsin.
00:00:13.720 --> 00:00:16.782: A quick reminder of a couple of best practices before`;

describe("preprocessVttToTranscript (domain logic)", () => {
  it("converts VTT to clean transcript format (timestamp: text)", () => {
    expect(preprocessVttToTranscript(sampleVtt)).toBe(expectedTxt);
  });

  it("returns empty string for empty input", () => {
    expect(preprocessVttToTranscript("")).toBe("");
  });

  it("ignores WEBVTT, NOTE, and blank lines", () => {
    const vtt = `WEBVTT\nNOTE something\n\n00:00:01.000 --> 00:00:02.000\nHello!\n`;
    expect(preprocessVttToTranscript(vtt)).toBe("00:00:01.000 --> 00:00:02.000: Hello!");
  });

  it("handles multi-line captions", () => {
    const vtt = `00:00:01.000 --> 00:00:02.000\nHello world!\nThis is a test.\n`;
    expect(preprocessVttToTranscript(vtt)).toBe("00:00:01.000 --> 00:00:02.000: Hello world!\nThis is a test.");
  });
});
