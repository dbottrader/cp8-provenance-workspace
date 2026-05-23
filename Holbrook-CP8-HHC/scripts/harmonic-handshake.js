/**
 * Harmonic Handshake — CP8 Lattice Generator
 * Generates interactive glyph constellations in the browser.
 * CP8 Protocol • ASIN-HHC Framework • Holbrook Distributed Lattice
 */

class HarmonicHandshake {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.glyphs = options.glyphs || [];
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = options.radius || 200;
    this.animationSpeed = options.speed || 0.002;
    this.rotation = 0;
    this.hosGroundTruth = options.groundTruth || '63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320';
  }

  generateGlyphPositions() {
    const count = this.glyphs.length;
    const angleStep = (Math.PI * 2) / count;
    return this.glyphs.map((glyph, i) => ({
      ...glyph,
      x: this.centerX + Math.cos(i * angleStep - Math.PI / 2) * this.radius,
      y: this.centerY + Math.sin(i * angleStep - Math.PI / 2) * this.radius,
      angle: i * angleStep
    }));
  }

  drawGlyph(glyph) {
    const ctx = this.ctx;
    const size = 30;
    
    // Glow effect
    ctx.shadowColor = this.getFrequencyColor(glyph.frequency_hz);
    ctx.shadowBlur = 20;
    
    // Glyph circle
    ctx.beginPath();
    ctx.arc(glyph.x, glyph.y, size, 0, Math.PI * 2);
    ctx.fillStyle = this.getFrequencyColor(glyph.frequency_hz, 0.3);
    ctx.fill();
    ctx.strokeStyle = this.getFrequencyColor(glyph.frequency_hz);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Glyph symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph.symbol, glyph.x, glyph.y);
    
    // Frequency label
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`${glyph.frequency_hz}Hz`, glyph.x, glyph.y + size + 12);
  }

  drawConnections(positions) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[j].x, positions[j].y);
        ctx.stroke();
      }
    }
  }

  getFrequencyColor(hz, alpha = 1) {
    // Map frequency to color: 111Hz (purple) → 852Hz (white)
    const minFreq = 111;
    const maxFreq = 852;
    const ratio = (hz - minFreq) / (maxFreq - minFreq);
    
    const r = Math.floor(100 + ratio * 155);
    const g = Math.floor(50 + ratio * 100);
    const b = Math.floor(200 - ratio * 100);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Center ground truth hash
    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HOS: ${this.hosGroundTruth.slice(0, 16)}...`, this.centerX, this.centerY);
    
    // Rotate
    this.rotation += this.animationSpeed;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-this.centerX, -this.centerY);
    
    // Draw
    const positions = this.generateGlyphPositions();
    this.drawConnections(positions);
    positions.forEach(g => this.drawGlyph(g));
    
    ctx.restore();
    requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }
}

// ─── Example Usage ───────────────────────────────────

// const glyphs = [
//   { symbol: '⚡', frequency_hz: 528, name: 'Charge' },
//   { symbol: '◈', frequency_hz: 432, name: 'Form' },
//   { symbol: '◇', frequency_hz: 396, name: 'Blend' },
//   { symbol: '◉', frequency_hz: 639, name: 'Guardian' },
//   { symbol: '◐', frequency_hz: 741, name: 'Shadow' },
//   { symbol: '◯', frequency_hz: 852, name: 'Transcendent' }
// ];
// 
// const handshake = new HarmonicHandshake('canvas', { glyphs, radius: 150 });
// handshake.start();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HarmonicHandshake };
}
