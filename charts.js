
class ChartEngine {
    constructor() { }
    drawLineChart(canvasId, data, labels) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.offsetWidth;
        const height = canvas.height = 200;
        const padding = 40;
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.font = '12px Outfit';
        ctx.fillStyle = '#94a3b8';
        const maxVal = Math.max(...data, 5); 
        const stepX = (width - padding * 2) / (data.length - 1);
        const stepY = (height - padding * 2) / maxVal;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding, height - padding - (data[0] * stepY));
        data.forEach((val, i) => {
            const x = padding + (i * stepX);
            const y = height - padding - (val * stepY);
            ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            ctx.fillText(label, padding + (i * stepX), height - 10);
        });
    }
    drawHeatmap(canvasId, historyMap, maxHabits) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellSize = 12;
        const gap = 4;
        const cols = 53;
        const rows = 7;
        const paddingLeft = 30; 
        const paddingTop = 20;
        const paddingBottom = 20;
        const width = canvas.width = paddingLeft + ((cellSize + gap) * cols);
        const height = canvas.height = paddingTop + ((cellSize + gap) * rows) + paddingBottom;
        ctx.clearRect(0, 0, width, height);
        ctx.font = '10px Outfit';
        ctx.textBaseline = 'middle';
        const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
        const today = new Date();
        const year = today.getFullYear();
        const jan1 = new Date(year, 0, 1);
        const dayOfWeekJan1 = jan1.getDay(); 
        const startDate = new Date(jan1);
        startDate.setDate(jan1.getDate() - dayOfWeekJan1);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        const days = ['Mon', 'Wed', 'Fri'];
        const dayIndices = [1, 3, 5];
        dayIndices.forEach((dIndex, i) => {
            const y = paddingTop + (dIndex * (cellSize + gap)) + (cellSize / 2);
            ctx.fillText(days[i], paddingLeft - 6, y);
        });
        let currentMonth = -1;
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < 7; r++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + (c * 7) + r);
                if (d.getFullYear() < year) continue;
                if (d.getFullYear() > year) continue;
                const dateStr = d.toLocaleDateString('en-CA');
                if (r === 0) {
                    const m = d.getMonth();
                    if (m !== currentMonth) {
                        currentMonth = m;
                        if (c < cols - 1) { 
                            ctx.fillStyle = '#94a3b8';
                            ctx.textAlign = 'left';
                            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                            ctx.fillText(monthName, paddingLeft + (c * (cellSize + gap)), paddingTop - 8);
                        }
                    }
                }
                const count = historyMap[dateStr] || 0;
                let level = 0;
                if (count > 0) {
                    const pct = count / (maxHabits || 1);
                    if (pct <= 0.25) level = 1;
                    else if (pct <= 0.50) level = 2;
                    else if (pct <= 0.75) level = 3;
                    else level = 4;
                }
                ctx.fillStyle = colors[level];
                const x = paddingLeft + (c * (cellSize + gap));
                const y = paddingTop + (r * (cellSize + gap));
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, cellSize, cellSize, 2);
                } else {
                    ctx.rect(x, y, cellSize, cellSize);
                }
                ctx.fill();
            }
        }
        const legendX = width - 100;
        const legendY = height - 5;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.fillText('Less', legendX - 5, legendY - cellSize / 2);
        colors.forEach((col, i) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            const lx = legendX + (i * (cellSize + 2));
            const ly = legendY - cellSize;
            if (ctx.roundRect) ctx.roundRect(lx, ly, cellSize, cellSize, 2);
            else ctx.rect(lx, ly, cellSize, cellSize);
            ctx.fill();
        });
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('More', legendX + (colors.length * (cellSize + 2)) + 5, legendY - cellSize / 2);
    }
}
