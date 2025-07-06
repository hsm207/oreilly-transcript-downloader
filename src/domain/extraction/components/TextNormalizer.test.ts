import { describe, it, expect } from 'vitest';
import { TextNormalizer } from './TextNormalizer';
describe('TextNormalizer', () => {
  it('normalizes curly quotes and whitespace', () => {
    const input = `"Hello"  'world'   test`;
    expect(TextNormalizer.normalizeText(input)).toBe('"Hello" ' + "'world'" + ' test');
  });
  it('trims and collapses whitespace', () => {
    const input = `  foo   bar \n baz  `;
    expect(TextNormalizer.normalizeText(input)).toBe('foo bar baz');
  });
  it('removes footnote <sup> and certain <a> tags', () => {
    const html = document.createElement('div');
    html.innerHTML = `<span>Text<sup>1</sup><a href='#ft_1'></a>more</span>`;
    expect(TextNormalizer.cleanNodeText(html)).toBe('Text more');
  });
  it('returns empty string for empty element', () => {
    const html = document.createElement('div');
    expect(TextNormalizer.cleanNodeText(html)).toBe('');
  });
  describe('stripEmojis', () => {
    it('should strip all emojis from text', () => {
      const textWithEmojis =
        "🚀 Embracing the #solopreneur life! 🌟 Juggling all roles, making decisions, and learning every day. It's a wild ride, but I'm loving the freedom and growth it brings. 👩‍💻📈 Shoutout to my fellow solopreneurs, let's show 'em what we're made of! 💪 #EntrepreneurSpirit #BossingItUp 🌍";
      const expectedText =
        " Embracing the #solopreneur life!  Juggling all roles, making decisions, and learning every day. It's a wild ride, but I'm loving the freedom and growth it brings.  Shoutout to my fellow solopreneurs, let's show 'em what we're made of!  #EntrepreneurSpirit #BossingItUp ";
      const result = TextNormalizer.stripEmojis(textWithEmojis);
      expect(result).toBe(expectedText);
    });
    it('should return original text if no emojis present', () => {
      const textWithoutEmojis = 'This is a normal text without any emojis.';
      const result = TextNormalizer.stripEmojis(textWithoutEmojis);
      expect(result).toBe(textWithoutEmojis);
    });
    it('should handle empty strings', () => {
      const result = TextNormalizer.stripEmojis('');
      expect(result).toBe('');
    });
    it('should strip various types of emojis', () => {
      const textWithVariousEmojis =
        '😀😃😄😁😆😅🤣😂🙂🙃👋🤚🖐️✋🖖👌🤏✌️🤞🤟🤘🤙❤️🧡💛💚💙💜🖤🤍🤎💔🔥💫⭐🌟✨⚡💥💢💨💦💤🎉🎊🎈🎁🚀🛸';
      const result = TextNormalizer.stripEmojis(textWithVariousEmojis);
      expect(result).toBe('');
    });
    it('should preserve text around emojis', () => {
      const textWithMixedContent = 'Hello 😀 world 🌍 this is a test 🧪!';
      const result = TextNormalizer.stripEmojis(textWithMixedContent);
      expect(result).toBe('Hello  world  this is a test !');
    });
  });
});
