document.addEventListener("DOMContentLoaded", function() {
    const participateBtn = document.getElementById("participate-btn");
    const activateSection = document.getElementById("activate-section");
    const timerEl = document.getElementById("timer");
    const activateBtn = document.getElementById("activate-btn");
    const codeInput = document.getElementById("activation-code");
    const finalMessage = document.getElementById("final-message");
    const heading = document.getElementById("heading");

    function startTimer(duration) {
        let timer = duration, days, hours, minutes, seconds;
        setInterval(function () {
            days = parseInt(timer / 86400, 10);
            hours = parseInt((timer % 86400) / 3600, 10);
            minutes = parseInt((timer % 3600) / 60, 10);
            seconds = parseInt(timer % 60, 10);

            timerEl.textContent = `Vaqt: ${days} kun ${hours} soat ${minutes} min ${seconds} sec`;

            if (--timer < 0) {
                timer = 0;
            }
        }, 1000);
    }

    function showFireworks() {
        const canvas = document.createElement('canvas');
        canvas.id = 'fireworks';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: Math.random() * 3 + 2,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                angle: Math.random() * 2 * Math.PI,
                speed: Math.random() * 5 + 2,
                alpha: 1
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;
                p.alpha -= 0.01;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
                ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 60%, ${p.alpha})`;
                ctx.fill();
            });

            if (particles.some(p => p.alpha > 0)) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(canvas);
            }
        }

        animate();
    }

    // Если клиент уже зарегистрирован, проверить и сразу показать соответствующий экран
    const savedClientId = localStorage.getItem("client_id");
    if (savedClientId) {
        fetch("/register_participation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: savedClientId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "already_registered") {
                localStorage.setItem("client_id", data.client_id);
                if (data.code !== "") {
                    // Уже активирован, сразу показываем благодарность
                    heading.style.display = "none";
                    timerEl.style.display = "none";
                    participateBtn.style.display = "none";
                    finalMessage.style.display = "block";
                    finalMessage.classList.add("fade-in");
                    showFireworks();
                } else {
                    // Зарегистрирован, но ещё не активировал код
                    participateBtn.style.display = "none";
                    activateSection.style.display = "block";
                    activateSection.classList.add("fade-in");
                    startTimer(7 * 24 * 60 * 60);
                }
            }
        });
    }

    participateBtn.addEventListener("click", function() {
        participateBtn.classList.add("fade-out");
        fetch("/register_participation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: savedClientId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.client_id) {
                localStorage.setItem("client_id", data.client_id);
            }
        });

        setTimeout(() => {
            participateBtn.style.display = "none";
            activateSection.style.display = "block";
            activateSection.classList.add("fade-in");
            startTimer(7 * 24 * 60 * 60);
            showFireworks();
        }, 1000);
    });

    activateBtn.addEventListener("click", function() {
        const code = codeInput.value.trim();
        const clientId = localStorage.getItem("client_id");
        if (!code) {
            alert("Введите код!");
            return;
        }
        if (!clientId) {
            alert("Ошибка: ID клиента не найден. Сначала нажмите участвовать в акции.");
            return;
        }

        fetch("/check_code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code, client_id: clientId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                activateSection.classList.add("fade-out");
                heading.classList.add("fade-out");
                timerEl.classList.add("fade-out");
                setTimeout(() => {
                    activateSection.style.display = "none";
                    timerEl.style.display = "none";
                    heading.style.display = "none";
                    finalMessage.style.display = "block";
                    finalMessage.classList.add("fade-in");
                    showFireworks();
                }, 1000);
            } else {
                alert("Код не найден или уже использован!");
            }
        });
    });
});
