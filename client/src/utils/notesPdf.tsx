import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";
import { marked, type Tokens, type Token } from "marked";

Font.registerHyphenationCallback((word) => [word]);

const COLOR = {
  title: "#0f0f23",
  heading: "#0f0f23",
  subheading: "#2d2d44",
  body: "#1a1a2e",
  muted: "#555577",
  border: "#e8e8f0",
  rule: "#d8d8e8",
  blockquoteBg: "#f4f4f8",
  blockquoteText: "#444466",
  accent: "#6366f1",
  codeBg: "#f4f4f8",
  codeText: "#3730a3",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.55,
    color: COLOR.body,
  },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: COLOR.title, marginBottom: 6, letterSpacing: -0.3 },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR.heading,
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR.border,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR.subheading, marginTop: 10, marginBottom: 3 },
  paragraph: { marginBottom: 6 },
  blockquote: {
    backgroundColor: COLOR.blockquoteBg,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    minHeight: 36,
    justifyContent: "center",
    color: COLOR.blockquoteText,
    fontSize: 10,
  },
  hr: { borderBottomWidth: 1, borderBottomColor: COLOR.border, marginVertical: 12 },
  listItemRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  listBullet: { width: 14, fontSize: 10.5 },
  listContent: { flex: 1 },
  nestedList: { marginTop: 2, marginLeft: 4 },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: COLOR.subheading,
    marginRight: 6,
    marginTop: 2,
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: COLOR.accent,
    backgroundColor: COLOR.accent,
    marginRight: 6,
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: COLOR.codeBg,
    color: COLOR.codeText,
    padding: 10,
    fontFamily: "Courier",
    fontSize: 9.5,
    borderRadius: 4,
    marginBottom: 8,
  },
  codespan: { fontFamily: "Courier", fontSize: 9.5, backgroundColor: COLOR.codeBg, color: COLOR.codeText },
  strong: { fontFamily: "Helvetica-Bold", color: COLOR.heading },
  em: { fontFamily: "Helvetica-Oblique", color: COLOR.muted },
  link: { color: COLOR.accent, textDecoration: "underline" },
  footer: {
    marginTop: 18,
    fontSize: 9,
    color: COLOR.muted,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
});

type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
};

function renderInline(tokens: Token[] | undefined, parent: InlineStyle = {}, keyPrefix = "i"): React.ReactElement[] {
  if (!tokens) return [];
  return tokens.flatMap((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (tok.type) {
      case "text": {
        const t = tok as Tokens.Text;
        if (t.tokens && t.tokens.length) return renderInline(t.tokens, parent, key);
        return [<Text key={key} style={styleFromInline(parent)}>{decodeEntities(t.text)}</Text>];
      }
      case "strong": {
        const t = tok as Tokens.Strong;
        return renderInline(t.tokens, { ...parent, bold: true }, key);
      }
      case "em": {
        const t = tok as Tokens.Em;
        return renderInline(t.tokens, { ...parent, italic: true }, key);
      }
      case "codespan": {
        const t = tok as Tokens.Codespan;
        return [<Text key={key} style={styles.codespan}>{decodeEntities(t.text)}</Text>];
      }
      case "link": {
        const t = tok as Tokens.Link;
        return renderInline(t.tokens, { ...parent, link: t.href }, key);
      }
      case "br":
        return [<Text key={key}>{"\n"}</Text>];
      case "del": {
        const t = tok as Tokens.Del;
        return renderInline(t.tokens, parent, key);
      }
      case "html": {
        const t = tok as Tokens.HTML;
        const stripped = t.text.replace(/<[^>]+>/g, "");
        if (!stripped) return [];
        return [<Text key={key} style={styleFromInline(parent)}>{decodeEntities(stripped)}</Text>];
      }
      case "escape": {
        const t = tok as Tokens.Escape;
        return [<Text key={key} style={styleFromInline(parent)}>{t.text}</Text>];
      }
      default:
        return [];
    }
  });
}

function styleFromInline(s: InlineStyle) {
  const out: Record<string, string | number> = {};
  if (s.bold && s.italic) out.fontFamily = "Helvetica-BoldOblique";
  else if (s.bold) out.fontFamily = "Helvetica-Bold";
  else if (s.italic) out.fontFamily = "Helvetica-Oblique";
  if (s.bold) out.color = COLOR.heading;
  if (s.link) {
    out.color = COLOR.accent;
    out.textDecoration = "underline";
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

function renderList(token: Tokens.List, keyPrefix: string, depth = 0): React.ReactElement {
  return (
    <View key={keyPrefix} style={depth > 0 ? styles.nestedList : { marginBottom: 6 }}>
      {token.items.map((item, idx) => {
        const itemKey = `${keyPrefix}-${idx}`;
        const isTask = item.task;
        const startNum = typeof token.start === "number" ? token.start : 1;
        const bullet = token.ordered
          ? `${startNum + idx}.`
          : depth === 0
            ? "•"
            : "–";

        const inlineTokens: Token[] = [];
        const blockChildren: React.ReactElement[] = [];

        item.tokens.forEach((child, cIdx) => {
          if (child.type === "text") {
            const t = child as Tokens.Text;
            if (t.tokens) inlineTokens.push(...t.tokens);
            else inlineTokens.push(child);
          } else if (child.type === "list") {
            blockChildren.push(renderList(child as Tokens.List, `${itemKey}-l${cIdx}`, depth + 1));
          } else if (child.type === "paragraph") {
            const p = child as Tokens.Paragraph;
            if (cIdx === 0) inlineTokens.push(...p.tokens);
            else
              blockChildren.push(
                <Text key={`${itemKey}-p${cIdx}`} style={{ marginTop: 2 }}>
                  {renderInline(p.tokens, {}, `${itemKey}-p${cIdx}`)}
                </Text>
              );
          } else {
            blockChildren.push(...renderBlock([child], `${itemKey}-b${cIdx}`));
          }
        });

        return (
          <View key={itemKey} style={styles.listItemRow}>
            {isTask ? (
              <View style={item.checked ? styles.checkboxChecked : styles.checkbox} />
            ) : (
              <Text style={styles.listBullet}>{bullet}</Text>
            )}
            <View style={styles.listContent}>
              <Text>{renderInline(inlineTokens, {}, itemKey)}</Text>
              {blockChildren}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function renderBlock(tokens: Token[], keyPrefix = "b"): React.ReactElement[] {
  return tokens.flatMap((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (tok.type) {
      case "heading": {
        const t = tok as Tokens.Heading;
        const style = t.depth === 1 ? styles.h1 : t.depth === 2 ? styles.h2 : styles.h3;
        const keepWithNext = t.depth >= 2 ? { minPresenceAhead: 80 } : {};
        return [<Text key={key} style={style} {...keepWithNext}>{renderInline(t.tokens, {}, key)}</Text>];
      }
      case "paragraph": {
        const t = tok as Tokens.Paragraph;
        return [<Text key={key} style={styles.paragraph}>{renderInline(t.tokens, {}, key)}</Text>];
      }
      case "blockquote": {
        const t = tok as Tokens.Blockquote;
        return [
          <View key={key} style={styles.blockquote}>
            {renderBlock(t.tokens, key)}
          </View>,
        ];
      }
      case "hr":
        return [<View key={key} style={styles.hr} />];
      case "list":
        return [renderList(tok as Tokens.List, key)];
      case "code": {
        const t = tok as Tokens.Code;
        return [<Text key={key} style={styles.codeBlock}>{t.text}</Text>];
      }
      case "space":
        return [];
      case "html": {
        const t = tok as Tokens.HTML;
        const stripped = t.text.replace(/<[^>]+>/g, "").trim();
        if (!stripped) return [];
        return [<Text key={key} style={styles.paragraph}>{decodeEntities(stripped)}</Text>];
      }
      default:
        return [];
    }
  });
}

function NotesDocument({ markdown }: { markdown: string }) {
  const tokens = marked.lexer(markdown);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderBlock(tokens)}
      </Page>
    </Document>
  );
}

export async function downloadNotesPdf(markdown: string, title?: string): Promise<void> {
  const blob = await pdf(<NotesDocument markdown={markdown} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "meeting-notes"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
