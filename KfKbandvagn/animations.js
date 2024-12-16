class explosion {
    constructor(row, col, type) {
        this.y = (row+0.5)*cellSize;
        this.x = (col+0.5)*cellSize;
        
        this.particles = [];
        if (type === 'explosion') {
            this.createExplosion();
        } else if (type === 'click') {
            this.createClickAnimation();
        }
    }

    createExplosion(){
        const numParticles = Math.floor(200+Math.random()*100);

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI*2;
            //const speed = Math.random()*7+0.1;
            const radius = Math.random()*2 + 1;

            let color, speed;
            const rand = Math.random();
            if (rand < 0.15) { 
                // for black particles
                color = `hsl(0, 0%, 0%)`;
                speed = Math.random() * 1.5 + 0.2; // Slower speed
            } else {
                // Colors in yellow to red range
                const hue = Math.random() * 60;
                color = `hsl(${hue}, 100%, 50%)`;
                speed = 1 + Math.random() * ((hue / 60) * 5); // Faster for brighter particles
            }

            this.particles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(angle)*speed,
                dy: Math.sin(angle)*speed,
                radius: radius,
                color: color,
                alpha:1
            })
        }
    }
    createClickAnimation() {
        const numParticles = Math.floor(100+Math.random()*50);

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI*2;
            const speed = Math.random()*2.5+0.1;
            const radius = Math.random()*2 + 1;
            const color = `hsl(${20}, 100%, 50%)`;

            this.particles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(angle)*speed,
                dy: Math.sin(angle)*speed,
                radius: radius,
                color: color,
                alpha:1
            })
        }
    }

    updateParticles() {
        if (this.particles.length == 0) {return}

        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dx *= 0.95;
            particle.dy *= 0.95;
            particle.alpha -= 0.02;

            return particle.alpha > 0;
        });

        this.particles.forEach(particle => {
            const partColors = particle.color.match(/[\d.]+/g);
            ctx.fillStyle = `hsla(${partColors[0]},${partColors[1]}%,${partColors[2]}%,${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI*2);
            ctx.fill();
        });
    }
}