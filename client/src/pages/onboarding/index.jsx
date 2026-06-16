import { useState } from "react";
import { useNavigate } from "react-router-dom";

import questions from "../../assets/questions";
import ProgressBar from "../../components/ProgressBar";
import OptionButton from "../../components/OptionButton";

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = questions[step];

  const handleSelect = (option) => {
    setAnswers({
      ...answers,
      [current.id]: option,
    });
  };

  const handleNext = () => {
    if (!answers[current.id]) return;

    if (step === questions.length - 1) {
      localStorage.setItem(
        "onboardingAnswers",
        JSON.stringify(answers)
      );

      navigate("/login");
      return;
    }

    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <ProgressBar
          current={step + 1}
          total={questions.length}
        />

        <p className="text-gray-400 mb-2">
          {step + 1} of {questions.length}
        </p>

        <h1 className="text-3xl font-bold mb-8">
          {current.title}
        </h1>

        {current.options.map((option) => (
          <OptionButton
            key={option}
            text={option}
            selected={answers[current.id] === option}
            onClick={() => handleSelect(option)}
          />
        ))}

        <button
          onClick={handleNext}
          disabled={!answers[current.id]}
          className="w-full mt-6 p-4 rounded-xl bg-white text-black font-semibold disabled:opacity-50"
        >
          {step === questions.length - 1 ? "Continue" : "Next"}
        </button>

      </div>
    </div>
  );
}