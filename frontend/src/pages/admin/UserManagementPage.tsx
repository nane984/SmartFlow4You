import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { ROLES, roleLabel } from "../../auth/roles";
import { formatApiErrors } from "../../util/formatApiErrors";
import {
    createManagedUser,
    deleteManagedUser,
    listManagedUsers,
    type ManagedUser,
    updateManagedUser,
} from "../../modules/admin/users.api";

type UserFormState = {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    password: string;
};

type EditUserFormState = {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    password: string;
    is_active: boolean;
};

const ROLE_OPTIONS = [
    ROLES.ADMIN,
    ROLES.HR_ADMIN,
    ROLES.TENDER_USER,
    ROLES.SUPPLIER,
    ROLES.CANDIDATE,
    ROLES.INTERVIEWER,
];

const EMPTY_FORM: UserFormState = {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: ROLES.CANDIDATE,
    password: "",
};

function toErrorMessage(err: unknown, fallback: string): string {
    const ax = err as { response?: { data?: unknown } };
    if (ax.response?.data) return formatApiErrors(ax.response.data);
    return fallback;
}

function formatWhen(iso: string | null): string {
    if (!iso) return "Never";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState<EditUserFormState>({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: ROLES.CANDIDATE,
        password: "",
        is_active: true,
    });

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setUsers(await listManagedUsers());
        } catch (e) {
            setError(toErrorMessage(e, "Failed to load users."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const visibleUsers = useMemo(() => {
        if (roleFilter === "all") return users;
        return users.filter((u) => u.role === roleFilter);
    }, [users, roleFilter]);

    const handleCreate = async () => {
        if (!form.username.trim() || !form.email.trim() || !form.password) {
            setError("Username, email and password are required.");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            await createManagedUser({
                username: form.username.trim(),
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                role: form.role,
                password: form.password,
            });
            setForm(EMPTY_FORM);
            await loadUsers();
        } catch (e) {
            setError(toErrorMessage(e, "Failed to create user."));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (user: ManagedUser) => {
        const ok = window.confirm(`Delete user "${user.username}"? This cannot be undone.`);
        if (!ok) return;
        setBusyId(user.id);
        setError(null);
        try {
            await deleteManagedUser(user.id);
            await loadUsers();
        } catch (e) {
            setError(toErrorMessage(e, "Failed to delete user."));
        } finally {
            setBusyId(null);
        }
    };

    const openEdit = (user: ManagedUser) => {
        setEditTarget(user);
        setEditForm({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            password: "",
            is_active: user.is_active,
        });
    };

    const handleEditSave = async () => {
        if (!editTarget) return;
        if (!editForm.username.trim() || !editForm.email.trim()) {
            setError("Username and email are required.");
            return;
        }

        setSavingEdit(true);
        setError(null);
        try {
            await updateManagedUser(editTarget.id, {
                username: editForm.username.trim(),
                email: editForm.email.trim(),
                first_name: editForm.first_name.trim(),
                last_name: editForm.last_name.trim(),
                role: editForm.role,
                is_active: editForm.is_active,
                password: editForm.password.trim() || undefined,
            });
            setEditTarget(null);
            await loadUsers();
        } catch (e) {
            setError(toErrorMessage(e, "Failed to update user."));
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="User management"
                description="Create internal users, assign roles, delete accounts and monitor last login."
            />

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            <Card className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Create new user</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Username">
                        <input
                            className={controlClass}
                            value={form.username}
                            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                        />
                    </Field>
                    <Field label="Email">
                        <input
                            type="email"
                            className={controlClass}
                            value={form.email}
                            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        />
                    </Field>
                    <Field label="First name">
                        <input
                            className={controlClass}
                            value={form.first_name}
                            onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                        />
                    </Field>
                    <Field label="Last name">
                        <input
                            className={controlClass}
                            value={form.last_name}
                            onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                        />
                    </Field>
                    <Field label="Role">
                        <select
                            className={controlClass}
                            value={form.role}
                            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                        >
                            {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                    {roleLabel(role)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Password">
                        <input
                            type="password"
                            className={controlClass}
                            value={form.password}
                            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        />
                    </Field>
                </div>
                <div className="flex justify-end">
                    <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
                        {creating ? "Creating..." : "Create user"}
                    </Button>
                </div>
            </Card>

            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900">Existing users</h2>
                    <select
                        className={`${controlClass} w-56`}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All roles</option>
                        {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                                {roleLabel(role)}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-600">Loading users…</p>
                ) : visibleUsers.length === 0 ? (
                    <p className="text-sm text-slate-600">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="px-3 py-2 font-medium">User</th>
                                    <th className="px-3 py-2 font-medium">Role</th>
                                    <th className="px-3 py-2 font-medium">Last login</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2">
                                            <p className="font-medium text-slate-900">{user.username}</p>
                                            <p className="text-xs text-slate-500">
                                                {user.first_name} {user.last_name} · {user.email}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                {roleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-700">
                                            {formatWhen(user.last_login)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {user.is_active ? (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={busyId === user.id}
                                                onClick={() => openEdit(user)}
                                                className="mr-2"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                disabled={busyId === user.id}
                                                onClick={() => void handleDelete(user)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {editTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <Card className="w-full max-w-2xl space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Edit user: {editTarget.username}
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Username">
                                <input
                                    className={controlClass}
                                    value={editForm.username}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, username: e.target.value }))
                                    }
                                />
                            </Field>
                            <Field label="Email">
                                <input
                                    type="email"
                                    className={controlClass}
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, email: e.target.value }))
                                    }
                                />
                            </Field>
                            <Field label="First name">
                                <input
                                    className={controlClass}
                                    value={editForm.first_name}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, first_name: e.target.value }))
                                    }
                                />
                            </Field>
                            <Field label="Last name">
                                <input
                                    className={controlClass}
                                    value={editForm.last_name}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, last_name: e.target.value }))
                                    }
                                />
                            </Field>
                            <Field label="Role">
                                <select
                                    className={controlClass}
                                    value={editForm.role}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, role: e.target.value }))
                                    }
                                >
                                    {ROLE_OPTIONS.map((role) => (
                                        <option key={role} value={role}>
                                            {roleLabel(role)}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Reset password (optional)">
                                <input
                                    type="password"
                                    className={controlClass}
                                    value={editForm.password}
                                    onChange={(e) =>
                                        setEditForm((s) => ({ ...s, password: e.target.value }))
                                    }
                                    placeholder="Leave empty to keep current password"
                                />
                            </Field>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={(e) =>
                                    setEditForm((s) => ({ ...s, is_active: e.target.checked }))
                                }
                            />
                            Active account
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditTarget(null)}
                                disabled={savingEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => void handleEditSave()}
                                disabled={savingEdit}
                            >
                                {savingEdit ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}
