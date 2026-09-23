import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBox, Spinner } from '@/components/ui/Feedback';
import {
  useAddConstraint,
  useAddPreference,
  useConstraints,
  useDeleteConstraint,
  useDeletePreference,
  usePreferences,
  useProfile,
  useUpdateProfile,
} from '@/hooks/useApi';
import type { Constraint, Preference } from '@/types/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profileId, signOut } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const constraints = useConstraints();
  const preferences = usePreferences();
  const addConstraint = useAddConstraint();
  const deleteConstraint = useDeleteConstraint();
  const addPreference = useAddPreference();
  const deletePreference = useDeletePreference();

  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const displayName = displayNameDraft ?? profile.data?.display_name ?? '';
  const [constraintType, setConstraintType] =
    useState<Constraint['constraint_type']>('allergy');
  const [constraintValue, setConstraintValue] = useState('');
  const [prefType, setPrefType] =
    useState<Preference['preference_type']>('cuisine');
  const [prefValue, setPrefValue] = useState('');
  const [prefWeight, setPrefWeight] = useState(2);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile.mutateAsync(displayName.trim());
      setDisplayNameDraft(null);
      setMessage('Display name updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function onAddConstraint(e: FormEvent) {
    e.preventDefault();
    if (!constraintValue.trim()) return;
    await addConstraint.mutateAsync({
      constraint_type: constraintType,
      value: constraintValue.trim().toLowerCase(),
    });
    setConstraintValue('');
  }

  async function onAddPreference(e: FormEvent) {
    e.preventDefault();
    if (!prefValue.trim()) return;
    await addPreference.mutateAsync({
      preference_type: prefType,
      value: prefValue.trim().toLowerCase(),
      weight: prefWeight,
    });
    setPrefValue('');
  }

  async function onSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      {profile.isLoading ? <Spinner /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-xs text-slate-500">Profile ID: {profileId}</p>
        <form onSubmit={saveName} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm">Display name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input value={user?.email ?? ''} readOnly disabled />
          </div>
          <Button type="submit" disabled={updateProfile.isPending}>
            Save name
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/onboarding')}
          >
            Preference setup chat
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Constraints</h2>
        {constraints.isLoading ? <Spinner /> : null}
        <ul className="mt-3 space-y-2">
          {(constraints.data ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{c.constraint_type}</span>: {c.value}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => deleteConstraint.mutate(c.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAddConstraint} className="mt-3 space-y-2">
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={constraintType}
            onChange={(e) =>
              setConstraintType(e.target.value as Constraint['constraint_type'])
            }
          >
            <option value="allergy">Allergy</option>
            <option value="excluded_ingredient">Excluded ingredient</option>
            <option value="diet">Diet</option>
          </select>
          <Input
            placeholder="Value"
            value={constraintValue}
            onChange={(e) => setConstraintValue(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Add constraint
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Preferences</h2>
        {preferences.isLoading ? <Spinner /> : null}
        <ul className="mt-3 space-y-2">
          {(preferences.data ?? []).map((p) => (
            <li
              key={`${p.preference_type}-${p.value}`}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{p.preference_type}</span>: {p.value}{' '}
                <span className="text-slate-500">(weight {p.weight})</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  deletePreference.mutate({
                    preference_type: p.preference_type,
                    value: p.value,
                  })
                }
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAddPreference} className="mt-3 space-y-2">
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={prefType}
            onChange={(e) =>
              setPrefType(e.target.value as Preference['preference_type'])
            }
          >
            <option value="cuisine">Cuisine</option>
            <option value="ingredient">Ingredient</option>
            <option value="spice_level">Spice level</option>
            <option value="meal_type">Meal type</option>
            <option value="prep_time">Prep time</option>
            <option value="texture">Texture</option>
          </select>
          <Input
            placeholder="Value"
            value={prefValue}
            onChange={(e) => setPrefValue(e.target.value)}
          />
          <label className="block text-sm">
            Weight: {prefWeight}
            <input
              type="range"
              min={-5}
              max={5}
              step={0.5}
              value={prefWeight}
              onChange={(e) => setPrefWeight(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <Button type="submit" variant="secondary">
            Add preference
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <h2 className="font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">
          Sign out clears chat history from this browser.
        </p>
        <Button className="mt-3" variant="danger" onClick={onSignOut}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
