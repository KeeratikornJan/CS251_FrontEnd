document.addEventListener('DOMContentLoaded', () => {
    // 1. Interactive Mouse Movement for Background Shapes
    const shape1 = document.querySelector('.shape-1');
    const shape2 = document.querySelector('.shape-2');
    const shape3 = document.querySelector('.shape-3');
    
    // Smooth transition vars
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
    });

    // Animation loop for smooth trailing effect
    function animateBackground() {
        // Easing factor
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        if (shape1) shape1.style.transform = `translate(${currentX * 100}px, ${currentY * 100}px)`;
        if (shape2) shape2.style.transform = `translate(${currentX * -150}px, ${currentY * -150}px)`;
        if (shape3) shape3.style.transform = `translate(calc(-50% + ${currentX * 200}px), calc(-50% + ${currentY * 200}px))`;

        requestAnimationFrame(animateBackground);
    }
    animateBackground();

    // 2. 3D Tilt Effect on Glass Card
    const card = document.querySelector('.glass-card');
    const container = document.querySelector('.container');

    if (container && card) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        container.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
            card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });

        container.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    }

    // 3. Ripple Effect on Buttons
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Note: Href anchor will still trigger as default behavior
        });
    });

    // --- Donor Registration Form Logic ---
    const donorForm = document.getElementById('donorForm');
    if (donorForm) {
        donorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const alertBox = document.getElementById('regAlert');
            alertBox.style.display = 'none';

            // Fetch values
            const idCard = document.getElementById('regIdCard').value.trim();
            const name = document.getElementById('regName').value.trim();
            const gender = document.getElementById('regGender').value;
            const dob = document.getElementById('regDOB').value;
            const phone = document.getElementById('regPhone').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const address = document.getElementById('regAddress').value.trim();
            const bloodType = document.getElementById('regBloodType').value;
            const rh = document.getElementById('regRh').value;
            const password = document.getElementById('regPassword').value;
            
            // output specific simulated validations
            // 1. Check if complete
            if (!idCard || !name || !gender || !dob || !phone || !email || !address || !bloodType || !rh || !password) {
                alertBox.textContent = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            // 2. Simulate Duplicate ID (e.g. if ID is exactly 1111111111111)
            if (idCard === '1111111111111') {
                alertBox.textContent = 'เลขบัตรประชาชนนี้ถูกลงทะเบียนแล้ว';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            // 3. Success -> generate PK and show view
            const newDonorId = 'DON-' + Math.floor(10000 + Math.random() * 90000);
            
            donorForm.style.display = 'none';
            document.getElementById('regSuccess').style.display = 'block';
            document.getElementById('regDonorIdOutput').textContent = `รหัสประจำตัวผู้บริจาค: ${newDonorId}`;
            
            // Optionally clear form
            donorForm.reset();
        });
    }

    // --- Employee Login Form Logic ---
    const staffLoginForm = document.getElementById('staffLoginForm');
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const alertBox = document.getElementById('loginAlert');
            alertBox.style.display = 'none';

            const empId = document.getElementById('empId').value.trim();
            const password = document.getElementById('empPassword').value;

            if (!empId || !password) {
                alertBox.textContent = 'กรุณากรอกรหัสพนักงานและรหัสผ่านให้ครบถ้วน';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            // Simulate login logic
            // E.g., any non-empty password passes, and name/role determined from ID
            let empName = "เจตนิพัทธ์ ธนาคารเลือด";
            let empRole = "เจ้าหน้าที่เทคนิคการแพทย์ (Medical Technologist)";

            if (empId.toUpperCase() === 'EMP-001') {
                empName = "ผู้อำนวยการ ธนาคารเลือด";
                empRole = "ผู้ดูแลระบบ (Admin)";
            } else if (password === 'wrong') {
                alertBox.textContent = 'รหัสผ่านไม่ถูกต้อง';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            // Success View
            staffLoginForm.style.display = 'none';
            const desc = document.querySelector('.description');
            if (desc) desc.style.display = 'none'; // hide generic desc
            
            document.getElementById('loginSuccess').style.display = 'block';
            document.getElementById('loginOutputName').textContent = `ชื่อ: ${empName}`;
            document.getElementById('loginOutputRole').textContent = `บทบาท: ${empRole}`;

            // Auto redirect to employee dashboard
            setTimeout(() => {
                window.location.href = 'employee-dashboard.html';
            }, 1000);
        });
    }

    // --- Donor Login Form Logic ---
    const donorLoginForm = document.getElementById('donorLoginForm');
    if (donorLoginForm) {
        donorLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const alertBox = document.getElementById('donorLoginAlert');
            alertBox.style.display = 'none';

            const donorId = document.getElementById('donorIdInput').value.trim();
            const password = document.getElementById('donorPasswordInput').value;

            if (!donorId || !password) {
                alertBox.textContent = 'กรุณากรอกรหัสผู้บริจาคและรหัสผ่านให้ครบถ้วน';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            if (password === 'wrong') {
                alertBox.textContent = 'รหัสผ่านไม่ถูกต้อง';
                alertBox.className = 'alert alert-error';
                alertBox.style.display = 'block';
                return;
            }

            donorLoginForm.style.display = 'none';
            
            // hide unneeded titles
            Array.from(document.querySelectorAll('.title, .description, .logo-container')).forEach(el => {
                if(el && el.parentElement === donorLoginForm.parentElement) el.style.display = 'none';
            });
            
            document.getElementById('donorLoginSuccess').style.display = 'block';
            
            // Auto redirect to dashboard
            setTimeout(() => {
                window.location.href = 'donor-dashboard.html';
            }, 1000);
        });
    }

    // --- Dashboard Sidebar Toggle ---
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
});
