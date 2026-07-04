import { Team } from '../types';

export function downloadTeamsAsImage(teams: Team[], drawTitle: string = "스맵의 아레나 CK 팀 뽑기 결과") {
  const canvas = document.createElement('canvas');
  
  const colWidth = 345;
  const rowHeight = 250;
  const startX = 65;
  const startY = 160;
  const gapX = 40;
  const gapY = 45;

  const rowsCount = Math.ceil(teams.length / 3);
  const canvasWidth = 1200;
  const canvasHeight = startY + rowsCount * (rowHeight + gapY) + 50; // extra padding at bottom

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient (Deep Dark Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGrad.addColorStop(0, '#0F0F13');
  bgGrad.addColorStop(1, '#1A1A24');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // esports Grid/Accent Graphics (Decorative borders)
  ctx.strokeStyle = '#FFD700'; // Gold point
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
  
  ctx.strokeStyle = '#4F46E5'; // Indigo Accent
  ctx.lineWidth = 0.5;
  ctx.strokeRect(25, 25, canvasWidth - 50, canvasHeight - 50);

  // Draw Title
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  
  // Smeb's Gold Title
  ctx.font = 'bold 36px "Inter", "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#FFD700'; // Gold
  ctx.fillText(drawTitle, canvasWidth / 2, 75);

  ctx.font = '16px "Inter", "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#9CA3AF'; // Muted grey
  const dateStr = new Date().toLocaleString('ko-KR', { hour12: false });
  ctx.fillText(`뽑기 일시: ${dateStr}  |  OFFICIAL ARENA GENERATOR`, canvasWidth / 2, 110);

  // Grid math: 3 columns, 2 rows
  // Col width: 350px. Row height: 260px.
  // Margins: X: 60px, Y: 150px. Gaps: X: 45px, Y: 40px.

  teams.forEach((team, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + col * (colWidth + gapX);
    const y = startY + row * (rowHeight + gapY);

    // Team Card Background
    ctx.fillStyle = '#18181F';
    ctx.beginPath();
    ctx.roundRect(x, y, colWidth, rowHeight, 12);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#2A2A35';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, colWidth, rowHeight, 12);
    ctx.stroke();

    // Team Card Header Background (Gold/Amber banner)
    ctx.fillStyle = 'rgba(79, 70, 229, 0.15)'; // indigo translucent
    ctx.beginPath();
    ctx.roundRect(x, y, colWidth, 50, [12, 12, 0, 0]);
    ctx.fill();

    // Team Header bottom border
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 50);
    ctx.lineTo(x + colWidth, y + 50);
    ctx.stroke();

    // Team Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Inter", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏅 ${team.name}`, x + 20, y + 32);

    // Team Members
    const tiers = [
      { num: 1, label: 'Tier 1 (Challenger~GM)', color: '#FBBF24', name: team.players[1] || '-' },
      { num: 2, label: 'Tier 2 (Master~Diamond)', color: '#818CF8', name: team.players[2] || '-' },
      { num: 3, label: 'Tier 3 (Emerald~Platinum)', color: '#34D399', name: team.players[3] || '-' }
    ];

    tiers.forEach((tier, tIdx) => {
      const itemY = y + 85 + tIdx * 52;

      // Draw light tier tag pill
      ctx.fillStyle = 'rgba(30, 30, 40, 0.6)';
      ctx.beginPath();
      ctx.roundRect(x + 15, itemY - 20, 65, 24, 6);
      ctx.fill();

      ctx.font = 'bold 11px "Inter", "Malgun Gothic", sans-serif';
      ctx.fillStyle = tier.color;
      ctx.textAlign = 'center';
      ctx.fillText(`T${tier.num} PLAYER`, x + 15 + 32.5, itemY - 4);

      // Draw player name
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px "Inter", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tier.name, x + 95, itemY - 3);

      // Draw visual divider between players (except the last one)
      if (tIdx < 2) {
        ctx.strokeStyle = '#22222E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 15, itemY + 15);
        ctx.lineTo(x + colWidth - 15, itemY + 15);
        ctx.stroke();
      }
    });
  });

  // Footer Credit
  ctx.fillStyle = '#4B5563';
  ctx.font = '12px "Inter", "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('스맵의 아레나 CK 공식 팀 뽑기  |  https://ai.studio/build', canvasWidth / 2, canvasHeight - 25);

  // Download Action
  try {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `smeb_arena_ck_draw_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Image rendering or downloading failed', err);
  }
}
