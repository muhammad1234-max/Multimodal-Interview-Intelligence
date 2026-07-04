# Contributing to Multimodal AI Interview Evaluator

First off, thank you for considering contributing to this project! It's people like you that make the open-source AI community such a fantastic place to learn, inspire, and create.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/placeholder/repository/issues) first to see if someone else has already created a ticket. If not, go ahead and [make one](https://github.com/placeholder/repository/issues/new)!

## 2. Fork & create a branch

If this is something you think you can fix, then [fork](https://help.github.com/articles/fork-a-repo) the repository and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-groq-fallback
```

## 3. Local Development Setup

To run the platform locally, ensure you have Node.js 18+ and Python 3.10+ installed.

1. **Frontend**: Navigate to the root directory and run `npm install`. Use `npm run dev` to start Vite.
2. **Backend**: Navigate to `/backend`. Create a virtual environment `python -m venv venv`. Activate it, run `pip install -r requirements.txt`, and start the FastAPI server with `python start_server.py`.

> **Note**: You must create a `.env` file containing your MongoDB URI and API keys. Use `.env.example` as a template.

## 4. Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

Ensure you adhere to our coding standards:
- **TypeScript**: Use strict typing. Avoid `any` where possible.
- **Python**: Follow PEP-8. Use structured JSON logging via `backend.utils.logger`.

## 5. Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with the main repository.

Then merge your feature branch into your master branch, and push it to your fork.

Finally, go to GitHub and [make a Pull Request](https://help.github.com/articles/creating-a-pull-request) to our `main` branch.

### PR Requirements:
- Pass all ESLint and TypeScript compilation checks (`npm run lint` and `tsc --noEmit`).
- Do not commit `.env` files or API keys.
- Ensure the React UI does not break on mobile viewports.

Thank you for contributing!
