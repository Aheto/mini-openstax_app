// src/components/shared/QuizItem.tsx
const QuizItem = ({ item, onAnswer }: { item: any; onAnswer: (selected: string) => void }) => {
  return (
    <div className="quiz-item" style={{ marginBottom: '1.5rem' }}>
      <p><strong>{item.prompt}</strong></p>
      {item.options.map((opt: any) => (
        <label key={opt.id} style={{ display: 'block', margin: '0.3rem 0' }}>
          <input
            type="radio"
            name={`q-${item.id}`}
            value={opt.id}
            onChange={(e) => onAnswer(e.target.value)}
          />
          {opt.text}
        </label>
      ))}
    </div>
  );
};
