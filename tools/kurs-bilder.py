# Erzeugt die Kursbilder (SVG) in img/kurs/. Alle Bilder nutzen dasselbe Schema:
# 640×360, weißer Hintergrund, abgerundete Kästen, Grün als Akzent, Grau für Nebensachen, Schrift Inter/System.
# Aufruf: python3 tools/kurs-bilder.py
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img", "kurs")
os.makedirs(OUT, exist_ok=True)
G, G2, GR, TX, MU, LN, BG = "#2b8a3e", "#e6f4ea", "#868e96", "#1f2328", "#5f687c", "#ced4da", "#ffffff"

def svg(name, body, title):
    s = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" font-family="Inter, -apple-system, Segoe UI, sans-serif">'
         '<title>' + title + '</title><rect width="640" height="360" rx="18" fill="' + BG + '"/>'
         '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + GR + '"/></marker></defs>'
         + body + '</svg>')
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(s)

def box(x, y, w, h, t, sub="", hi=False):
    f, st, c = (G2, G, G) if hi else ("#f8f9fa", LN, TX)
    s = '<rect x="%d" y="%d" width="%d" height="%d" rx="12" fill="%s" stroke="%s" stroke-width="2"/>' % (x, y, w, h, f, st)
    ty = y + h / 2 + (0 if sub else 7)
    s += '<text x="%d" y="%d" text-anchor="middle" font-size="19" font-weight="700" fill="%s">%s</text>' % (x + w / 2, ty - (4 if sub else 0), c, t)
    if sub: s += '<text x="%d" y="%d" text-anchor="middle" font-size="14" fill="%s">%s</text>' % (x + w / 2, ty + 18, MU, sub)
    return s
def arrow(x1, y1, x2, y2, dash=False):
    return '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2.5" marker-end="url(#a)"%s/>' % (x1, y1, x2, y2, GR, ' stroke-dasharray="6 5"' if dash else "")
def text(x, y, t, size=16, color=MU, anchor="middle", weight="400"):
    return '<text x="%d" y="%d" text-anchor="%s" font-size="%d" font-weight="%s" fill="%s">%s</text>' % (x, y, anchor, size, weight, color, t)
def head(t): return text(32, 44, t, 22, TX, "start", "800")

# ---------- Batteriespeicher ----------
svg("bess-aufbau", head("Aufbau eines Batteriespeichers") +
    box(30, 150, 110, 70, "Netz", "AC") + arrow(140, 185, 168, 185) +
    box(170, 150, 120, 70, "Trafo", "Spannung") + arrow(290, 185, 318, 185) +
    box(320, 150, 120, 70, "PCS", "AC ↔ DC") + arrow(440, 185, 468, 185) +
    box(470, 120, 140, 130, "Batterie", "Zellen + BMS", True) +
    box(320, 270, 290, 56, "Kühlung · Brandschutz") +
    box(320, 70, 120, 56, "EMS", "steuert") + arrow(380, 126, 380, 148, True) + arrow(440, 98, 520, 118, True),
    "Aufbau eines Batteriespeichers")
svg("bess-leistung-energie", head("Leistung × Dauer = Energie") +
    '<line x1="90" y1="300" x2="600" y2="300" stroke="%s" stroke-width="2"/><line x1="90" y1="300" x2="90" y2="80" stroke="%s" stroke-width="2"/>' % (TX, TX) +
    '<rect x="91" y="140" width="400" height="159" fill="%s" stroke="%s" stroke-width="2"/>' % (G2, G) +
    text(291, 225, "Energie = 10 MW × 2 h = 20 MWh", 20, G, "middle", "700") +
    text(70, 145, "10 MW", 15, TX, "end") + text(70, 300, "0", 15, TX, "end") + text(491, 324, "2 h", 15, TX) + text(345, 348, "Dauer →", 15, MU) +
    text(40, 220, "Leistung", 15, MU, "middle") , "Leistung mal Dauer ergibt Energie")
rows = [("2C", 60, "30 min"), ("1C", 120, "1 h"), ("0,5C", 240, "2 h"), ("0,25C", 480, "4 h")]
b = head("C-Rate und Entladedauer")
for i, (c, w, t) in enumerate(rows):
    y = 80 + i * 66
    b += text(80, y + 30, c, 19, TX, "end", "700") + '<rect x="100" y="%d" width="%d" height="42" rx="8" fill="%s" stroke="%s" stroke-width="2"/>' % (y, w, G2, G) + text(110 + w, y + 28, t, 16, MU, "start")
svg("bess-crate", b, "C-Rate und Entladedauer")
svg("bess-btm-ftm", head("Behind- und Front-of-the-Meter") +
    text(160, 84, "Behind-the-Meter", 17, G, "middle", "700") + text(480, 84, "Front-of-the-Meter", 17, G, "middle", "700") +
    box(95, 100, 130, 50, "Netz") + arrow(160, 150, 160, 174) + box(95, 176, 130, 46, "Zähler") + arrow(160, 222, 160, 246) +
    '<rect x="40" y="248" width="240" height="90" rx="14" fill="none" stroke="%s" stroke-width="2" stroke-dasharray="6 5"/>' % LN + text(160, 268, "Betrieb", 14, MU) +
    box(52, 278, 106, 50, "Anlagen") + box(166, 278, 106, 50, "Speicher", "", True) +
    '<line x1="320" y1="90" x2="320" y2="340" stroke="%s" stroke-width="2"/>' % LN +
    box(415, 120, 130, 56, "Netz") + arrow(480, 176, 480, 222) + box(400, 224, 160, 64, "Speicher", "eigener Anschluss", True) +
    text(480, 320, "Erlöse: Markt + Regelleistung", 15, MU), "Behind-the-Meter und Front-of-the-Meter")
pts = [(0, 70), (2, 60), (4, 52), (6, 75), (8, 95), (10, 60), (12, 30), (14, 35), (16, 70), (18, 120), (20, 100), (22, 80), (24, 72)]
def px(h): return 80 + h * 21
def py(p): return 300 - p * 1.6
path = "M" + " L".join("%d %d" % (px(h), py(p)) for h, p in pts)
svg("bess-arbitrage", head("Arbitrage: günstig laden, teuer verkaufen") +
    '<line x1="80" y1="300" x2="590" y2="300" stroke="%s" stroke-width="2"/>' % TX +
    '<rect x="%d" y="90" width="%d" height="210" fill="%s"/>' % (px(11), px(15) - px(11), G2) + '<rect x="%d" y="90" width="%d" height="210" fill="#fdecec"/>' % (px(17.5), px(20.5) - px(17.5)) +
    '<path d="%s" fill="none" stroke="%s" stroke-width="3.5"/>' % (path, TX) +
    text(px(13), 288, "laden", 17, G, "middle", "700") + text(px(19), 288, "entladen", 17, "#c62828", "middle", "700") +
    "".join(text(px(h), 322, "%d h" % h, 13, MU) for h in (0, 6, 12, 18, 24)) + text(60, 96, "€/MWh", 13, MU, "start"),
    "Arbitrage über den Tag")
svg("bess-regelleistung", head("Regelleistung: wer reagiert wann?") +
    '<line x1="80" y1="300" x2="600" y2="300" stroke="%s" stroke-width="2"/>' % TX +
    '<rect x="80" y="100" width="70" height="50" rx="8" fill="%s" stroke="%s" stroke-width="2"/>' % (G2, G) + text(180, 132, "FCR · voll nach 30 s", 17, TX, "start", "700") +
    '<rect x="80" y="170" width="200" height="50" rx="8" fill="#f1f3f5" stroke="%s" stroke-width="2"/>' % GR + text(300, 202, "aFRR · voll nach 5 min", 17, TX, "start", "700") +
    '<rect x="80" y="240" width="420" height="50" rx="8" fill="#f8f9fa" stroke="%s" stroke-width="2"/>' % LN + text(510, 272, "mFRR · ~15 min", 17, TX, "start", "700") +
    text(80, 322, "Störung", 13, MU, "start") + text(600, 322, "Zeit →", 13, MU, "end"), "Regelleistungsarten")
steps = ["Fläche + Netz", "Genehmigung", "FID", "Bau", "Betrieb"]
b = head("Projektphasen eines Großspeichers")
for i, t in enumerate(steps):
    x = 30 + i * 118; hi = i in (0, 4)
    b += '<path d="M%d 150 L%d 150 L%d 190 L%d 230 L%d 230 L%d 190 Z" fill="%s" stroke="%s" stroke-width="2"/>' % (x, x + 100, x + 120, x + 100, x, x + 20 if i else x, G2 if hi else "#f8f9fa", G if hi else LN)
    b += text(x + 60, 196, t, 14, G if hi else TX, "middle", "700")
b += text(320, 290, "Ohne Fläche und Netzanschluss lohnt kein weiterer Schritt.", 16, MU)
svg("bess-phasen", b, "Projektphasen")

# ---------- Künstliche Intelligenz ----------
svg("ki-begriffe", head("KI, maschinelles Lernen, Deep Learning") +
    '<ellipse cx="320" cy="205" rx="280" ry="135" fill="#f8f9fa" stroke="%s" stroke-width="2"/>' % LN + text(320, 100, "Künstliche Intelligenz", 18, TX, "middle", "700") +
    '<ellipse cx="320" cy="225" rx="195" ry="100" fill="#f1f3f5" stroke="%s" stroke-width="2"/>' % GR + text(320, 152, "Maschinelles Lernen", 18, TX, "middle", "700") +
    '<ellipse cx="320" cy="248" rx="115" ry="62" fill="%s" stroke="%s" stroke-width="2"/>' % (G2, G) + text(320, 245, "Deep Learning", 18, G, "middle", "700") + text(320, 268, "z. B. Sprachmodelle", 14, MU),
    "KI, maschinelles Lernen und Deep Learning")
b = head("Ein künstliches Neuron")
for i, (x, w) in enumerate([("x₁", "w₁"), ("x₂", "w₂"), ("x₃", "w₃")]):
    y = 110 + i * 80
    b += '<circle cx="80" cy="%d" r="26" fill="#f8f9fa" stroke="%s" stroke-width="2"/>' % (y, LN) + text(80, y + 6, x, 18, TX, "middle", "700")
    b += arrow(106, y, 262, 190 + (i - 1) * 18) + text(180, y - 10 + (i - 1) * 25, w, 15, G, "middle", "700")
b += '<circle cx="300" cy="190" r="38" fill="%s" stroke="%s" stroke-width="2"/>' % (G2, G) + text(300, 198, "Σ + b", 18, G, "middle", "700")
b += arrow(338, 190, 398, 190) + box(400, 160, 120, 60, "ReLU", "Aktivierung") + arrow(520, 190, 578, 190) + text(605, 196, "y", 20, TX, "middle", "700")
b += text(320, 320, "gewichtete Summe + Bias → Aktivierung → Ausgabe", 16, MU)
svg("ki-neuron", b, "Ein künstliches Neuron")
cx = [(x, 300 - 0.0029 * (x - 330) ** 2) for x in range(90, 581, 10)]
curve = "M" + " L".join("%d %d" % (x, y) for x, y in cx)
dots = [150, 215, 262, 296, 318]
b = head("Gradientenabstieg: Schritt für Schritt ins Tal") + '<path d="%s" fill="none" stroke="%s" stroke-width="3"/>' % (curve, TX)
for i, x in enumerate(dots):
    y = 300 - 0.0029 * (x - 330) ** 2
    b += '<circle cx="%d" cy="%d" r="8" fill="%s"/>' % (x, y, G)
    if i < len(dots) - 1:
        x2 = dots[i + 1]; y2 = 300 - 0.0029 * (x2 - 330) ** 2
        b += arrow(x + 6, y + 2, x2 - 8, y2 - 2)
b += text(330, 330, "Minimum", 15, G, "middle", "700") + text(60, 90, "Verlust", 14, MU, "start") + text(590, 340, "Parameter →", 14, MU, "end")
svg("ki-gradient", b, "Gradientenabstieg")
tr = "M90 110 Q200 230 320 270 T580 300"; va = "M90 115 Q200 225 300 250 T580 160"
svg("ki-overfitting", head("Overfitting erkennen") +
    '<line x1="90" y1="310" x2="590" y2="310" stroke="%s" stroke-width="2"/><line x1="90" y1="310" x2="90" y2="80" stroke="%s" stroke-width="2"/>' % (TX, TX) +
    '<path d="%s" fill="none" stroke="%s" stroke-width="3.5"/>' % (tr, G) + '<path d="%s" fill="none" stroke="#c62828" stroke-width="3.5" stroke-dasharray="8 6"/>' % va +
    '<line x1="330" y1="90" x2="330" y2="310" stroke="%s" stroke-width="2" stroke-dasharray="4 4"/>' % GR + text(338, 104, "hier stoppen", 14, MU, "start") +
    text(585, 296, "Training", 15, G, "end", "700") + text(585, 150, "Validierung", 15, "#c62828", "end", "700") +
    text(80, 96, "Fehler", 14, MU, "end") + text(590, 336, "Trainingsdauer →", 14, MU, "end"), "Overfitting erkennen")
svg("ki-rag", head("RAG: Wissen nachschlagen, dann antworten") +
    box(30, 80, 150, 60, "Dokumente") + arrow(180, 110, 228, 110) + box(230, 80, 150, 60, "Abschnitte", "+ Embeddings") + arrow(380, 110, 428, 110) +
    box(430, 80, 180, 60, "Vektor-DB") + box(30, 220, 150, 60, "Frage") + arrow(180, 250, 430, 250) + text(305, 240, "ähnliche Abschnitte suchen", 14, MU) +
    arrow(520, 140, 520, 218, True) + box(430, 220, 180, 60, "Sprachmodell", "Frage + Abschnitte", True) + arrow(520, 280, 520, 318) + text(520, 340, "Antwort mit Quellen", 16, G, "middle", "700"),
    "Ablauf von RAG")
steps = ["Vortraining", "Fine-Tuning", "RLHF", "Reasoning"]
subs = ["nächstes Token", "gute Beispiele", "Präferenzen", "länger nachdenken"]
b = head("Vom Rohmodell zum Assistenten")
for i, t in enumerate(steps):
    x = 30 + i * 148
    b += '<path d="M%d 140 L%d 140 L%d 185 L%d 230 L%d 230 L%d 185 Z" fill="%s" stroke="%s" stroke-width="2"/>' % (x, x + 128, x + 150, x + 128, x, x + 22 if i else x, G2 if i == 0 else "#f8f9fa", G if i == 0 else LN)
    b += text(x + 72, 182, t, 16, G if i == 0 else TX, "middle", "700") + text(x + 72, 204, subs[i], 13, MU)
b += text(320, 290, "Das Vortraining kostet den Großteil der Rechenleistung.", 16, MU)
svg("ki-training", b, "Trainingsphasen eines Assistenten")
words = ["Die", "Katze", "jagte", "die", "Maus,", "weil", "sie", "hungrig", "war"]
b = head("Attention: Worauf achtet „sie“?")
xs = []; x = 36
for w in words:
    wd = 14 + len(w) * 10.5; xs.append(x + wd / 2)
    hi = w in ("sie", "Katze")
    b += '<rect x="%d" y="230" width="%d" height="44" rx="10" fill="%s" stroke="%s" stroke-width="2"/>' % (x, wd, G2 if hi else "#f8f9fa", G if hi else LN) + text(x + wd / 2, 258, w, 16, G if hi else TX, "middle", "700" if hi else "400")
    x += wd + 8
src = xs[6]
for i, wgt in [(1, 7), (4, 2.5), (7, 2)]:
    mid = (src + xs[i]) / 2; top = 230 - abs(src - xs[i]) * 0.45
    b += '<path d="M%d 228 Q%d %d %d 228" fill="none" stroke="%s" stroke-width="%s" opacity="%s"/>' % (src, mid, top, xs[i], G, wgt, 1 if wgt > 3 else .55)
b += text(320, 320, "Dicke Linie = hohe Aufmerksamkeit", 15, MU)
svg("ki-attention", b, "Attention am Beispiel")
print("Bilder erzeugt in", os.path.normpath(OUT))
