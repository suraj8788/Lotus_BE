import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { User } from "../entities/User";

const EVENT_HIGHLIGHTS = [
  "Live Orchestra",
  "Live Bollywood Singer",
  "Food Stalls",
  "Shopping Stalls",
  "Kids Play Area",
  "Bouncers & Security",
];

const EVENT_VENUE =
  "Deen Dayal Upadhyay Playground, Behind Hiranandani, near Achija Restaurant, Plot 20, Sector 7, Kharghar";

const EVENT_GUESTS = [
  { image: "img1-cutout.png", name: "Shri. Pareshji Thakur", role: "BJP Leader" },
  { image: "img2-cutout.png", name: "Adv. Naresh Thakur", role: "(Corporate PMC) Organizer" },
  { image: "img3-cutout.png", name: "Mrs. Harshada Amar Upadhyay", role: "(Ex. Corporate PMC) Organizer" },
  { image: "img4-cutout.png", name: "MLA. Prashantji Thakur", role: "" },
  { image: "img5-cutout.png", name: "Shri. Nitin Bhai Patil", role: "Mayor (P.M.C.)" },
  { image: "img6-cutout.png", name: "Adv. Amar Upadhyay", role: "BJP Vice President Kharghar - Organizer" },
];

const EVENT_ORGANISERS = EVENT_GUESTS.map(({ name }) => name).join(" | ");

class EventPassService {
  async generate(user: User): Promise<Buffer> {
    const qrCode = user.qrCode;

    if (!qrCode) {
      throw new Error("A QR code is required to generate the event pass");
    }

    const logo = this.getAssetPath("logo.jpeg");
    const guests = EVENT_GUESTS.map((guest) => ({
      ...guest,
      imagePath: this.getAssetPath(guest.image),
    }));

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const document = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `${user.fullName} - Event Entry Pass`,
          Author: "Key Show Event",
          Subject: "Personalized event entry pass",
        },
      });

      document.on("data", (chunk: Buffer) => chunks.push(chunk));
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", reject);

      try {
        this.drawPass(document, user, qrCode, logo, guests);
        document.end();
      } catch (error) {
        document.end();
        reject(error);
      }
    });
  }

  private drawPass(
    document: PDFKit.PDFDocument,
    user: User,
    qrCode: string,
    logoPath: string,
    guests: Array<(typeof EVENT_GUESTS)[number] & { imagePath: string }>,
  ): void {
    const pageWidth = document.page.width;
    const pageHeight = document.page.height;
    const purple = "#431644";
    const magenta = "#9D164F";
    const coral = "#E98269";
    const gold = "#FFD21F";
    const cream = "#FFF9EC";
    const ink = "#4B1637";

    const background = document.linearGradient(0, 0, 0, pageHeight);
    background.stop(0, purple).stop(0.52, magenta).stop(1, coral);
    document.rect(0, 0, pageWidth, pageHeight).fill(background);

    this.drawPosterBunting(document, pageWidth);
    this.drawLightGarlands(document, pageWidth);
    this.drawLogoWatermark(document, logoPath, pageWidth, pageHeight);

    document.save();
    document.roundedRect(171, 19, 253, 91, 15).fillOpacity(0.96).fill(cream);
    document.roundedRect(171, 19, 253, 91, 15).lineWidth(2).strokeColor(gold).stroke();
    document.image(logoPath, 180, 25, { fit: [235, 79], align: "center", valign: "center" });
    document.restore();
    document.fillOpacity(1);

    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(13).text("DANCE IS DEVOTION", 0, 119, {
      width: pageWidth,
      align: "center",
      characterSpacing: 1.2,
    });
    document.fillColor(gold).font("Helvetica-Bold").fontSize(18).text("A GARBA MAHOTSAV", 0, 140, {
      width: pageWidth,
      align: "center",
      characterSpacing: 1.3,
    });
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9).text("EVENT DATES", 0, 171, {
      width: pageWidth,
      align: "center",
      characterSpacing: 1,
    });
    document.fillColor(gold).font("Helvetica-Bold").fontSize(25).text("11th-19th", 0, 183, {
      width: pageWidth,
      align: "center",
    });
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10).text("7 PM ONWARDS", 0, 211, {
      width: pageWidth,
      align: "center",
      characterSpacing: 1.1,
    });

    guests.forEach((guest, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      this.drawGuestCard(document, guest, 30 + column * 183, 237 + row * 174, 169, 160, gold, ink);
    });

    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5).text("EVENT HIGHLIGHTS", 0, 587, {
      width: pageWidth,
      align: "center",
      characterSpacing: 1,
    });

    EVENT_HIGHLIGHTS.forEach((highlight, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 30 + column * 183;
      const y = 604 + row * 28;

      document.fillOpacity(0.92).roundedRect(x, y, 169, 21, 7).fill(cream);
      document.fillOpacity(1).circle(x + 11, y + 10.5, 3.7).fill(gold);
      document.fillColor(ink).font("Helvetica-Bold").fontSize(7.2).text(highlight, x + 20, y + 6, {
        width: 142,
      });
    });

    document.fillOpacity(0.17).roundedRect(28, 668, 539, 143, 14).fill("#FFFFFF");
    document.fillOpacity(1);
    this.drawPosterDetail(document, "GUEST", `${user.fullName} | ${user.mobileNumber}`, 44, 683, 174);
    this.drawPosterDetail(document, "ORGANISED BY", EVENT_ORGANISERS, 230, 683, 205);
    this.drawPosterDetail(document, "VENUE", EVENT_VENUE, 44, 738, 390);

    const qrData = qrCode.includes(",") ? qrCode.split(",")[1] : qrCode;
    const qrBuffer = Buffer.from(qrData, "base64");
    document.roundedRect(452, 677, 99, 113, 9).fill("#FFFFFF");
    document.image(qrBuffer, 461, 686, { fit: [81, 81] });
    document.fillColor(magenta).font("Helvetica-Bold").fontSize(6.5).text("SCAN FOR ENTRY", 457, 771, {
      width: 89,
      align: "center",
    });

    document.fillColor("#FFE9B0").font("Helvetica").fontSize(7).text(
      `Pass ID ${user.id.slice(0, 13).toUpperCase()} - Personal pass - one entry per event day`,
      35,
      823,
      { width: 525, align: "center" },
    );
  }

  private drawLogoWatermark(
    document: PDFKit.PDFDocument,
    logoPath: string,
    pageWidth: number,
    pageHeight: number,
  ): void {
    document.save();
    document.opacity(0.065);
    document.image(logoPath, 70, pageHeight / 2 - 151, {
      fit: [pageWidth - 140, 302],
      align: "center",
      valign: "center",
    });
    document.restore();
  }

  private drawGuestCard(
    document: PDFKit.PDFDocument,
    guest: (typeof EVENT_GUESTS)[number] & { imagePath: string },
    x: number,
    y: number,
    width: number,
    height: number,
    borderColor: string,
    ink: string,
  ): void {
    document.save();
    document.fillOpacity(0.92).roundedRect(x, y, width, height, 12).fill("#FFF9EC");
    document.fillOpacity(1).roundedRect(x, y, width, height, 12).lineWidth(1.5).strokeColor(borderColor).stroke();

    document.save();
    document.roundedRect(x + 5, y + 5, width - 10, 108, 9).clip();
    document.image(guest.imagePath, x + 8, y + 7, {
      fit: [width - 16, 105],
      align: "center",
      valign: "bottom",
    });
    document.restore();

    document.fillColor(ink).font("Helvetica-Bold").fontSize(8.7).text(guest.name, x + 7, y + 118, {
      width: width - 14,
      height: 21,
      align: "center",
      lineGap: 0,
    });
    if (guest.role) {
      document.fillColor("#6A3353").font("Helvetica-Bold").fontSize(6.3).text(guest.role, x + 7, y + 142, {
        width: width - 14,
        height: 14,
        align: "center",
        lineGap: 0,
      });
    }
    document.restore();
  }

  private drawPosterBunting(document: PDFKit.PDFDocument, pageWidth: number): void {
    const colors = ["#7B2E5E", "#C04463", "#D96D55", "#68426F"];

    document.fillOpacity(0.55);
    for (let index = 0; index < 11; index += 1) {
      const x = 18 + index * 56;
      const y = 7 + (index % 3) * 3;
      document.moveTo(x, y).lineTo(x + 27, y + 34).lineTo(x + 54, y).closePath().fill(colors[index % colors.length]);
    }
    document.fillOpacity(1);
    document.moveTo(12, 10).lineTo(pageWidth - 12, 10).lineWidth(1).strokeColor("#C26B86").stroke();
  }

  private drawLightGarlands(document: PDFKit.PDFDocument, pageWidth: number): void {
    const configurations = [
      { startY: 22, depth: 47, phase: 0 },
      { startY: 37, depth: 60, phase: 0.45 },
      { startY: 52, depth: 68, phase: 0.9 },
    ];

    document.fillOpacity(0.28);
    configurations.forEach(({ startY, depth, phase }) => {
      for (let index = 0; index <= 44; index += 1) {
        const progress = index / 44;
        const x = 20 + progress * (pageWidth - 40);
        const curve = 4 * progress * (1 - progress);
        const y = startY + depth * curve + Math.sin(index * 0.8 + phase) * 1.3;
        document.circle(x, y, index % 5 === 0 ? 1.8 : 1.25).fill("#F3B9D0");
      }
    });
    document.fillOpacity(1);
  }

  private drawPosterDetail(
    document: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ): void {
    document.fillColor("#FFD21F").font("Helvetica-Bold").fontSize(7).text(label, x, y, {
      width,
      characterSpacing: 0.8,
    });
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text(value, x, y + 12, {
      width,
      lineGap: 1.5,
    });
  }

  private getAssetPath(filename: string): string {
    const assetPath = path.resolve(process.cwd(), "assets", "event", filename);

    if (!fs.existsSync(assetPath)) {
      throw new Error(`Event PDF asset is missing: ${filename}`);
    }

    return assetPath;
  }
}

export const eventPassService = new EventPassService();
