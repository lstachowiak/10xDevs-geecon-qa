# GeeCON Q&A

A web application to streamline Q&A sessions at the GeeCON conference, allowing attendees to anonymously submit and upvote questions online.

## Table of Contents

* [Project Description](#project-description)
* [Tech Stack](#tech-stack)
* [Getting Started Locally](#getting-started-locally)
* [Available Scripts](#available-scripts)
* [Project Scope](#project-scope)
* [Project Status](#project-status)
* [License](#license)

## Project Description

This project aims to enhance the Q&A experience during GeeCON conference sessions. It provides a platform for attendees to ask questions anonymously and vote for the ones they find most interesting. This helps moderators and speakers prioritize and address the most popular questions in real time.

### Key Features

**Attendees**

* Access a session via a unique URL
* Submit questions (anonymously or with a name)
* Upvote questions from other attendees

**Moderators & Speakers**

* Log in to a dedicated panel
* Manage sessions
* View incoming questions in real time
* Mark questions as answered
* Remove inappropriate content

## Tech Stack

### Frontend

* Astro 5
* React 19
* TypeScript 5
* Tailwind CSS 4
* shadcn/ui

### Backend & Database

* Supabase (PostgreSQL)

### CI/CD & Hosting

* GitHub Actions
* DigitalOcean

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

* **Node.js**: The required version is specified in the `.nvmrc` file. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager).
* **Package Manager**: npm

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:4321
```

## Available Scripts

The following scripts are available in the `package.json` file:

* `npm run dev` – Starts the development server
* `npm run build` – Builds the application for production
* `npm run preview` – Serves the production build locally for preview
* `npm run lint` – Lints the codebase for errors
* `npm run lint:fix` – Lints the codebase and automatically fixes issues
* `npm run format` – Formats the code using Prettier

## Project Scope

### In Scope (MVP)

* Creation and moderation of Q&A sessions for individual presentations
* Anonymous question submission and upvoting
* Moderator panel for real-time question management
* Invite-only registration system for new moderators

### Out of Scope (MVP)

* Parallel support for multiple conference rooms with a synchronized schedule
* Email or push notifications
* Integration with external conference management systems
* Advanced analytics beyond question counts

## Project Status

**Current Stage:** In Development

This project is currently under active development for the Minimum Viable Product (MVP) release.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
