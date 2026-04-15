
const card = document.getElementById('tiltCard');
const wrapper = document.querySelector('.card-wrapper');
let cX = 0;
let cY = 0;
let tX = 0;
let tY = 0;
if (wrapper && card) {
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tX = ((x / rect.width) - 0.5) * 6;
      tY = ((y / rect.height) - 0.5) * -6;
    });
    wrapper.addEventListener('mouseleave', () => {
      tX = 0;
      tY = 0;
    });
    function animate() {
      cX += (tX - cX) * 0.1;
      cY += (tY - cY) * 0.1;
      if (card) card.style.transform = `rotateY(${cX}deg) rotateX(${cY}deg)`;
      requestAnimationFrame(animate);
    }
    animate();
}
