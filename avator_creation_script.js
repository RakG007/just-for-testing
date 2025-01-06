import * as faceapi from 'face-api.js';

export function initAvatarCreation(THREE, OrbitControls) {
  (async () => {
    const detectedDataEl = document.getElementById('detected-data');

    // Load face-api models
    await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
    await faceapi.nets.ageGenderNet.loadFromUri('./models');
    await faceapi.nets.faceExpressionNet.loadFromUri('./models');

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('avatarContainer').appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Avatar base
    const materialSkin = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const materialClothing = new THREE.MeshStandardMaterial({ color: 0x3366cc });

    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), materialSkin);
    head.position.set(0, 1.5, 0);
    scene.add(head);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1, 2, 32), materialClothing);
    body.position.set(0, 0, 0);
    scene.add(body);

    // Function to update avatar appearance
    const updateAvatar = (gender, age, emotion) => {
      // Gender-based appearance
      if (gender === 'male') {
        head.material.color.set(0xffcc99); // Skin tone for male
      } else {
        head.material.color.set(0xfadadd); // Skin tone for female
      }

      // Emotion-based clothing color
      const emotionColors = {
        happy: 0xffff00, // Yellow
        sad: 0x0000ff, // Blue
        angry: 0xff0000, // Red
        surprised: 0x00ff00, // Green
      };
      body.material.color.set(emotionColors[emotion] || 0x3366cc);

      // Age-based scaling
      const scaleFactor = Math.max(1, Math.min(age / 20, 2));
      head.scale.set(scaleFactor, scaleFactor, scaleFactor);
      body.scale.set(scaleFactor, scaleFactor, scaleFactor);
    };

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;

    // Webcam video setup
    const video = document.createElement('video');
    video.autoplay = true;
    video.width = 640;
    video.height = 480;

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
    });

    // Detection and avatar update loop
    const detectAndUpdate = async () => {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender()
        .withFaceExpressions();

      if (detections) {
        const { age, gender, expressions } = detections;
        const emotion = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );

        detectedDataEl.textContent = `Gender: ${gender}, Age: ${Math.round(age)}, Emotion: ${emotion}`;
        updateAvatar(gender, Math.round(age), emotion);
      }

      requestAnimationFrame(detectAndUpdate);
    };

    // Start detection loop
    detectAndUpdate();

    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  })();
}
