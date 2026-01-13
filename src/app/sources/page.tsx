"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string; type: "system" | "custom" };

type Source = {
  id: string;
  platform: string;
  handle: string | null;
  link: string | null;
  campaign_id: string | null;
};

type Tag = { id: string; name: string };

export default function SourcesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sources, setSources] = React.useState<Source[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [newCategory, setNewCategory] = React.useState("");
  const [categoryDrawerOpen, setCategoryDrawerOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryDraft, setCategoryDraft] = React.useState({ name: "" });
  const [categoryFormError, setCategoryFormError] = React.useState<string | null>(null);

  const [newSource, setNewSource] = React.useState({
    platform: "",
    handle: "",
    link: "",
    campaign_id: ""
  });
  const [sourceDrawerOpen, setSourceDrawerOpen] = React.useState(false);
  const [editingSource, setEditingSource] = React.useState<Source | null>(null);
  const [sourceDraft, setSourceDraft] = React.useState({
    platform: "",
    handle: "",
    link: "",
    campaign_id: ""
  });
  const [sourceFormError, setSourceFormError] = React.useState<string | null>(null);

  const [newTag, setNewTag] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "category" | "source" | "tag";
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setError(null);
    try {
      const [categoriesResponse, sourcesResponse, tagsResponse] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/sources", { cache: "no-store" }),
        fetch("/api/tags", { cache: "no-store" })
      ]);

      if (!categoriesResponse.ok) throw new Error("Failed to load categories");
      if (!sourcesResponse.ok) throw new Error("Failed to load sources");
      if (!tagsResponse.ok) throw new Error("Failed to load tags");

      const categoriesPayload = await categoriesResponse.json();
      const sourcesPayload = await sourcesResponse.json();
      const tagsPayload = await tagsResponse.json();

      setCategories(categoriesPayload.categories ?? []);
      setSources(sourcesPayload.sources ?? []);
      setTags(tagsPayload.tags ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() })
    });

    if (response.ok) {
      setNewCategory("");
      loadData();
    } else {
      setError("Failed to create category");
    }
  };

  const closeCategoryDrawer = React.useCallback(() => {
    setCategoryDrawerOpen(false);
    setEditingCategory(null);
    setCategoryDraft({ name: "" });
    setCategoryFormError(null);
  }, []);

  const openCategoryDrawer = (category: Category) => {
    setEditingCategory(category);
    setCategoryDraft({ name: category.name });
    setCategoryFormError(null);
    setCategoryDrawerOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!categoryDraft.name.trim()) {
      setCategoryFormError("Category name is required.");
      return;
    }

    const response = await fetch(`/api/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryDraft.name.trim() })
    });

    if (response.ok) {
      closeCategoryDrawer();
      loadData();
    } else {
      setError("Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const response = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
    if (response.ok) {
      loadData();
      return;
    }
    throw new Error("Failed to delete category");
  };

  const handleCreateSource = async () => {
    if (!newSource.platform.trim()) return;
    const response = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: newSource.platform.trim(),
        handle: newSource.handle.trim() || null,
        link: newSource.link.trim() || null,
        campaign_id: newSource.campaign_id.trim() || null
      })
    });

    if (response.ok) {
      setNewSource({ platform: "", handle: "", link: "", campaign_id: "" });
      loadData();
    } else {
      setError("Failed to create source");
    }
  };

  const closeSourceDrawer = React.useCallback(() => {
    setSourceDrawerOpen(false);
    setEditingSource(null);
    setSourceDraft({ platform: "", handle: "", link: "", campaign_id: "" });
    setSourceFormError(null);
  }, []);

  const openSourceDrawer = (source: Source) => {
    setEditingSource(source);
    setSourceDraft({
      platform: source.platform,
      handle: source.handle ?? "",
      link: source.link ?? "",
      campaign_id: source.campaign_id ?? ""
    });
    setSourceFormError(null);
    setSourceDrawerOpen(true);
  };

  const handleSaveSource = async () => {
    if (!editingSource) return;
    if (!sourceDraft.platform.trim()) {
      setSourceFormError("Platform is required.");
      return;
    }

    const response = await fetch(`/api/sources/${editingSource.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: sourceDraft.platform.trim(),
        handle: sourceDraft.handle.trim() || null,
        link: sourceDraft.link.trim() || null,
        campaign_id: sourceDraft.campaign_id.trim() || null
      })
    });

    if (response.ok) {
      closeSourceDrawer();
      loadData();
    } else {
      setError("Failed to update source");
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    const response = await fetch(`/api/sources/${sourceId}`, { method: "DELETE" });
    if (response.ok) {
      loadData();
      return;
    }
    throw new Error("Failed to delete source");
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTag.trim() })
    });

    if (response.ok) {
      setNewTag("");
      loadData();
    } else {
      setError("Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const response = await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
    if (response.ok) {
      loadData();
      return;
    }
    throw new Error("Failed to delete tag");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      if (deleteTarget.type === "category") {
        await handleDeleteCategory(deleteTarget.id);
      } else if (deleteTarget.type === "source") {
        await handleDeleteSource(deleteTarget.id);
      } else {
        await handleDeleteTag(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sources & Categories"
        description="Manage system categories, custom sources, and tags."
      />

      {error ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-negative">
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                />
                <Button onClick={handleCreateCategory}>Add Category</Button>
              </div>

              <div className="space-y-3">
                {categories.map((category) => {
                  return (
                    <div
                      key={category.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{category.name}</span>
                        <Badge variant={category.type === "system" ? "default" : "success"}>
                          {category.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.type === "custom" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCategoryDrawer(category)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "category",
                                  id: category.id,
                                  label: category.name
                                })
                              }
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-mutedForeground">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={categoryDrawerOpen}
            onOpenChange={(open) => {
              if (!open) closeCategoryDrawer();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit category</DialogTitle>
                <DialogDescription>Update a custom category name.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category name</Label>
                  <Input
                    id="category-name"
                    value={categoryDraft.name}
                    onChange={(event) => {
                      setCategoryDraft({ name: event.target.value });
                      if (categoryFormError) setCategoryFormError(null);
                    }}
                  />
                  {categoryFormError ? (
                    <p className="text-xs text-negative">{categoryFormError}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-mutedForeground">
                  <span>Type</span>
                  <Badge variant={editingCategory?.type === "system" ? "default" : "success"}>
                    {editingCategory?.type ?? "custom"}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveCategory}>Save changes</Button>
                <Button variant="outline" onClick={closeCategoryDrawer}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Platform"
                  value={newSource.platform}
                  onChange={(event) => setNewSource((prev) => ({ ...prev, platform: event.target.value }))}
                />
                <Input
                  placeholder="Handle"
                  value={newSource.handle}
                  onChange={(event) => setNewSource((prev) => ({ ...prev, handle: event.target.value }))}
                />
                <Input
                  placeholder="Link"
                  value={newSource.link}
                  onChange={(event) => setNewSource((prev) => ({ ...prev, link: event.target.value }))}
                />
                <Input
                  placeholder="Campaign ID"
                  value={newSource.campaign_id}
                  onChange={(event) => setNewSource((prev) => ({ ...prev, campaign_id: event.target.value }))}
                />
              </div>
              <Button onClick={handleCreateSource}>Add Source</Button>

              <div className="space-y-3">
                {sources.map((source) => {
                  return (
                    <div
                      key={source.id}
                      className="rounded-2xl border border-border px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{source.platform}</p>
                          <p className="text-xs text-mutedForeground">
                            {source.handle || "-"} · {source.link || "-"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSourceDrawer(source)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({
                                type: "source",
                                id: source.id,
                                label: source.platform
                              })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={sourceDrawerOpen}
            onOpenChange={(open) => {
              if (!open) closeSourceDrawer();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit source</DialogTitle>
                <DialogDescription>Update platform details and identifiers.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="source-platform">Platform</Label>
                  <Input
                    id="source-platform"
                    value={sourceDraft.platform}
                    onChange={(event) => {
                      setSourceDraft((prev) => ({ ...prev, platform: event.target.value }));
                      if (sourceFormError) setSourceFormError(null);
                    }}
                  />
                  {sourceFormError ? (
                    <p className="text-xs text-negative">{sourceFormError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-handle">Handle</Label>
                  <Input
                    id="source-handle"
                    value={sourceDraft.handle}
                    onChange={(event) =>
                      setSourceDraft((prev) => ({ ...prev, handle: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-link">Link</Label>
                  <Input
                    id="source-link"
                    value={sourceDraft.link}
                    onChange={(event) =>
                      setSourceDraft((prev) => ({ ...prev, link: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="source-campaign">Campaign ID</Label>
                  <Input
                    id="source-campaign"
                    value={sourceDraft.campaign_id}
                    onChange={(event) =>
                      setSourceDraft((prev) => ({ ...prev, campaign_id: event.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSource}>Save changes</Button>
                <Button variant="outline" onClick={closeSourceDrawer}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="New tag"
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                />
                <Button onClick={handleCreateTag}>Add Tag</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className="rounded-full border border-border px-3 py-1 text-sm"
                    onClick={() =>
                      setDeleteTarget({
                        type: "tag",
                        id: tag.id,
                        label: tag.name
                      })
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === "category"
            ? "Delete category?"
            : deleteTarget?.type === "source"
            ? "Delete source?"
            : "Delete tag?"
        }
        description={
          deleteTarget
            ? `Remove ${deleteTarget.label}. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        loading={deleting}
        destructive
      />
    </div>
  );
}
