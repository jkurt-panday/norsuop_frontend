import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowUpRight,
  ClipboardList,
  Database,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogIn,
  Mail,
  MapPin,
  Send,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useCurrentUser } from "./auth/queries";

type ProcessType = "payment" | "assessment";

const processes = {
  payment: {
    label: "Order of Payment",
    description: "From online submission to a completed Order of Payment in three clear steps.",
    steps: [
      ["Request a payment", "Complete and submit the public Order of Payment form.", Send],
      ["Staff process your request", "The Accounting Office reviews and prepares your request.", UserRoundCog],
      ["Receive your Order of Payment", "Get the completed document when it is ready.", FileCheck2],
    ],
  },
  assessment: {
    label: "Assessment",
    description: "From submitting your details to receiving your student assessment in four clear steps.",
    steps: [
      ["Request an assessment", "Complete and submit the public student assessment form.", Send],
      ["The system fetches your records", "Your available student account records are gathered for review.", Database],
      ["Staff review your request", "The Accounting Office verifies your details and prepares the assessment.", UserRoundCog],
      ["Receive your assessment", "Receive your prepared student account assessment by email.", FileCheck2],
    ],
  },
} as const;

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "cashier") return "/cashier/requests";
  if (role === "staff") return "/staff/requests";
  return "/";
}

export function WelcomePage() {
  const [selectedProcess, setSelectedProcess] = useState<ProcessType>("payment");
  const [showTeam, setShowTeam] = useState(false);
  const userQuery = useCurrentUser();
  const user = userQuery.data?.data;
  const process = processes[selectedProcess];
  return (
    <div className="min-h-screen bg-[#061b36] text-white selection:bg-sky-300 selection:text-[#061b36]">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-white px-4 py-2 font-semibold text-[#064b9b] shadow-xl transition-transform focus:translate-y-0 focus:outline-none"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#064b9b]/75 shadow-[0_12px_35px_-22px_rgba(0,20,50,0.85)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 rounded-lg"
          >
            <img
              src="/norsu.png"
              alt="NORSU"
              className="h-10 w-16 shrink-0 object-contain"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium sm:text-base">
                Negros Oriental State University
              </span>
              <span className="block text-xs text-blue-200">
                Order of Payment System
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-blue-100 md:flex">
            <a href="#hero" className="hover:text-white">
              About
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>
          {user ? (
            <Link
              to={dashboardPath(user.role)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            >
              <LogIn className="size-4" />
              Staff sign in
            </Link>
          )}
        </div>
      </header>

      <div className="relative isolate overflow-hidden lg:min-h-[650px]">
        <img
          src="/images/norsu-campus.jpg.webp"
          alt=""
          className="absolute inset-0 -z-30 size-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(110deg,rgba(4,24,50,0.98)_5%,rgba(5,57,117,0.88)_55%,rgba(1,32,72,0.74)_100%)]" />
        <div className="absolute -top-40 right-[8%] -z-10 size-[34rem] rounded-full bg-sky-300/20 blur-[110px]" />
        <main id="main-content">
          <section
            id="hero"
            className="mx-auto grid max-w-[90rem] scroll-mt-20 items-center gap-12 px-5 py-16 sm:px-8 lg:min-h-[650px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:px-8 lg:py-20"
          >
            <div className="max-w-2xl">
              <h1 className="max-w-[16ch] text-4xl leading-[1.05] font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Request your Order of Payment online
              </h1>
              <p className="mt-6 max-w-[62ch] text-lg leading-8 text-blue-100 sm:text-xl">
                Submit an Order of Payment or request a student assessment
                online—no office visit needed to get started.
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-2xl">
              <div className="border-b border-white/15 px-6 py-5 sm:px-8">
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Start a public request
                </h2>
              </div>
              <Link
                to="/assessmentform"
                className="group flex items-start gap-4 border-b border-white/15 px-6 py-7 hover:bg-white/10 sm:px-8"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-sky-200/25 bg-sky-300/15 text-sky-200">
                  <ClipboardList className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-semibold">
                    Request an Assessment
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-blue-200">
                    Ask the Accounting Office to prepare a student account
                    assessment.
                  </span>
                </span>
                <ArrowUpRight className="size-5 text-sky-300" />
              </Link>
              <Link
                to="/opform"
                className="group flex items-start gap-4 px-6 py-7 hover:bg-white/10 sm:px-8"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-sky-200/25 bg-sky-300/15 text-sky-200">
                  <FileText className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-semibold">
                    Request an Order of Payment
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-blue-200">
                    For university fees, services, and other approved
                    transactions.
                  </span>
                </span>
                <ArrowUpRight className="size-5 text-sky-300" />
              </Link>
            </div>
          </section>
        </main>
      </div>

      <section
        id="features"
        className="scroll-mt-20 bg-white py-20 text-[#10233f] lg:py-24"
      >
        <div className="mx-auto max-w-360 px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
            How your request moves
          </h2>
          <p className="mt-5 max-w-4xl leading-8 text-slate-600">
            {process.description}
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 rounded-xl border border-[#b9d3ef] bg-[#eef5ff] p-1.5">
            {(Object.keys(processes) as ProcessType[]).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={selectedProcess === type}
                onClick={() => setSelectedProcess(type)}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${selectedProcess === type ? "bg-[#064b9b] text-white" : "text-[#294765] hover:bg-white"}`}
              >
                {processes[type].label}
              </button>
            ))}
          </div>
          <ol
            className={`relative mt-12 grid gap-8 before:absolute before:top-8 before:bottom-8 before:left-8 before:w-px before:bg-[#9fc4ee] lg:grid-cols-${selectedProcess === "assessment" ? "4" : "3"} lg:before:top-8 lg:before:right-8 lg:before:bottom-auto lg:before:left-8 lg:before:h-px lg:before:w-auto`}
          >
            {process.steps.map(([title, description, Icon], index) => (
              <li
                key={title}
                className="relative grid grid-cols-[4rem_1fr] gap-5 lg:grid-cols-1"
              >
                <span className="relative z-10 flex size-16 items-center justify-center rounded-full border border-[#9fc4ee] bg-white text-[#064b9b] shadow-lg">
                  <Icon className="size-7" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0d51b5]">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-20 bg-[#064b9b] py-20 text-white"
      >
        <div className="mx-auto grid max-w-360 gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:gap-20">
          <div className="divide-y divide-white/20 border-y border-white/20">
            <div className="flex items-start gap-4 py-7">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#064b9b]">
                <MapPin className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Accounting Office</h3>
                <p className="mt-2 leading-7 text-blue-100">
                  Negros Oriental State University
                  <br />
                  Main Campus
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 py-7">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#064b9b]">
                <Mail className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Email</h3>
                <a
                  href="mailto:accounting.norsu@norsu.edu.ph"
                  className="mt-2 inline-block text-blue-100 underline"
                >
                  accounting.norsu@norsu.edu.ph
                </a>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold sm:text-5xl">
              Need help with your request?
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-8 text-blue-100">
              Visit the Accounting Office for assistance with an existing
              request. Keep your reference number ready so staff can locate it
              quickly.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 text-[#10233f] sm:py-14">
        <div className="mx-auto grid max-w-360 items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl">About the Team</h2>
            <p className="mt-4 leading-7 text-slate-600">
              This system was designed and developed by NORSU student interns
              in collaboration with the Accounting Office.
            </p>
            <button
              type="button"
              onClick={() => setShowTeam((visible) => !visible)}
              className="mt-5 rounded-lg bg-[#064b9b] px-5 py-2.5 font-semibold text-white"
            >
              {showTeam ? "Hide team" : "Meet the team"}
            </button>
            {showTeam && (
              <p className="mt-6 border-t border-slate-200 pt-5 leading-7 text-slate-600">
                Student interns contributed to the system's interface,
                workflows, ledger tools, testing, and continued improvement
                with guidance from the Accounting Office.
              </p>
            )}
          </div>
          <span className="flex size-28 items-center justify-center justify-self-start rounded-full bg-[#eaf3ff] text-[#0d51b5] lg:justify-self-end">
            <Users className="size-14" />
          </span>
        </div>
      </section>
      <footer className="border-t border-white/10 bg-[#061b36] px-5 py-9 text-sm text-blue-200 sm:px-8">
        <div className="mx-auto flex max-w-360 flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <img
              src="/norsu.png"
              alt="Negros Oriental State University"
              className="h-14 w-20 object-contain"
            />
            <p className="font-semibold text-white">
              <span className="block">Our Hope</span>
              <span className="block">Our Pride</span>
              <span className="block">Our Future</span>
            </p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p>Negros Oriental State University · Accounting Office</p>
            <p>Main Campus</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
