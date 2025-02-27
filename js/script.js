document.addEventListener("DOMContentLoaded", function () {
    gsap.to(".hero-bg", {
        scale: 1.2, 
        duration: 5,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    });
});
