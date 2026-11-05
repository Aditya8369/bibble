import type { CreateLearningMapInput } from "@/lib/maps/create-learning-map";
import { useTheme } from "@/hooks/use-theme";
import { AlertCircle, ArrowUpRight, Upload } from "lucide-react";
import { ChangeEvent, FormEvent } from "react";
import styles from "../create-page.module.css";

interface CreateMapFormProps {
  values: CreateLearningMapInput;
  onChange: (values: CreateLearningMapInput) => void;
  onCreate: (values: CreateLearningMapInput) => void;
  onImport?: (file: File) => void;
  importError?: string | null;
}

export function CreateMapForm({
  values,
  onChange,
  onCreate,
  onImport,
  importError,
}: CreateMapFormProps) {
  const { motif } = useTheme();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(values);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    event.target.value = "";
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <span aria-hidden="true">{motif.badgeEmoji}</span>
        <div>
          <h2>Name your world</h2>
          <p>Keep it simple — you can change everything later.</p>
        </div>
      </div>

      <label htmlFor="map-name">
        Map name
        <input
          id="map-name"
          value={values.title}
          onChange={(event) => onChange({ ...values, title: event.target.value })}
          placeholder="e.g. Ceramic painting"
          autoFocus
        />
      </label>

      <label htmlFor="map-description">
        Description <span className={styles.optional}>Optional</span>
        <textarea
          id="map-description"
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          placeholder="What do you want this little world to help you grow?"
          rows={4}
        />
      </label>

      <label htmlFor="map-category">
        Category
        <input
          id="map-category"
          value={values.category}
          onChange={(event) => onChange({ ...values, category: event.target.value })}
          placeholder="e.g. Creative practice"
        />
      </label>

      <button className={`button-primary ${styles.submit}`} type="submit">
        Create map <ArrowUpRight size={17} />
      </button>

      {onImport && (
        <>
          <div className={styles.divider}>
            <span>or</span>
          </div>

          <label htmlFor="import-map-file" className={styles.importLabel}>
            <input
              id="import-map-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              className={styles.fileInput}
              aria-describedby={importError ? "import-map-error" : undefined}
            />
            <span className={styles.importButton}>
              <Upload size={16} /> Import map
            </span>
          </label>
        </>
      )}

      {importError && (
        <p id="import-map-error" role="alert" className={styles.errorMessage}>
          <AlertCircle size={15} /> {importError}
        </p>
      )}
    </form>
  );
}
