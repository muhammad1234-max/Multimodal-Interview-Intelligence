# Deployment Guide

This guide provides step-by-step instructions to deploy the Multimodal AI Interview Evaluator.

The architecture uses:

- **Frontend:** Vercel
- **Backend:** Hugging Face Spaces (Docker)
- **Database:** MongoDB Atlas (Already deployed)

---

## 1. Local Docker Verification

Before deploying to the cloud, verify that the backend Docker image builds successfully on your local machine.

1.  Open your terminal and navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Build the Docker image:
    ```bash
    docker build -t multimodal-backend .
    ```
    _Note: This might take a few minutes as it downloads PyTorch, ffmpeg, and other heavy dependencies._
3.  (Optional) Run the Docker image locally to test it:
    ```bash
    docker run -p 7860:7860 -v ./weights:/app/weights multimodal-backend
    ```
    You should be able to access the API at `http://localhost:7860`.

---

## 2. Pushing to GitHub (CI/CD)

The CI/CD pipelines are already configured in `.github/workflows/`.

1.  Commit all changes and push your repository to GitHub:
    ```bash
    git add .
    git commit -m "Add CI/CD and Docker deployment configs"
    git push origin main
    ```
2.  Go to your GitHub repository and click on the **Actions** tab. You will see the `Frontend CI/CD` and `Backend CI/CD` pipelines running automatically to ensure your code is error-free.

---

## 3. Deploying the Backend (Hugging Face Spaces)

Hugging Face Spaces provides a free 16GB RAM environment which is essential for our AI models.

1.  Create a [Hugging Face](https://huggingface.co/) account if you don't have one.
2.  Go to **Spaces** -> **Create new Space**.
3.  Fill out the form:
    - **Space name:** `multimodal-interview-backend` (or similar)
    - **License:** `MIT` (or your choice)
    - **Select the Space SDK:** Choose **Docker** -> **Blank**.
    - **Space Hardware:** Free (16GB RAM, 2 vCPU).
4.  Click **Create Space**.
5.  Clone the Hugging Face Space repository to your local machine (instructions provided on the Space page).
6.  Copy the contents of your `backend` directory (including the `Dockerfile`, `requirements.txt`, and all Python files) into the cloned Space repository.
    - _Important:_ If you have pre-trained model weights in `backend/weights/`, make sure they are included or downloaded dynamically in your code, as Hugging Face Spaces supports Large File Storage (LFS).
7.  Set your Environment Variables in the Hugging Face Space settings (Settings -> Variables and secrets):
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: Your authentication secret.
8.  Commit and push to the Hugging Face remote:
    ```bash
    git add .
    git commit -m "Deploy backend"
    git push
    ```
9.  Hugging Face will automatically build your Docker container and start the server. Your API will be live at `https://<your-username>-<space-name>.hf.space`.

---

## 4. Deploying the Frontend (Vercel)

Vercel provides a seamless deployment experience for Vite + React applications.

1.  Create a [Vercel](https://vercel.com/) account and link it to your GitHub account.
2.  Click **Add New...** -> **Project**.
3.  Import the GitHub repository containing your frontend code.
4.  Vercel will automatically detect that it's a **Vite** project and configure the build settings:
    - **Framework Preset:** Vite
    - **Build Command:** `npm run build`
    - **Output Directory:** `dist`
5.  Expand the **Environment Variables** section and add your backend URL.
    - _Note:_ Ensure your frontend code refers to this environment variable (e.g., `VITE_API_URL`) instead of a hardcoded `localhost`.
    - Set `VITE_API_URL` to `https://<your-username>-<space-name>.hf.space`.
6.  Click **Deploy**.
7.  Vercel will build your application and provide a live URL!

## 5. Wrapping Up

Your project is now fully deployed with continuous integration!

- Every push to GitHub will automatically trigger the CI pipelines.
- Vercel will automatically redeploy the frontend on every push.
- To update the backend, simply push your backend changes to the Hugging Face Space repository.
