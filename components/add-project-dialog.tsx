"use client";

import * as React from "react";
import { useFinanceStore, Project } from "@/lib/store";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2 } from "lucide-react";

interface ProjectDialogProps {
  children?: React.ReactNode;
  project?: Project;
}

export function ProjectDialog({ children, project }: ProjectDialogProps) {
  const { setProjects, projects, updateProject } = useFinanceStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(project?.name || "");
  const [client, setClient] = React.useState(project?.client || "");
  const [value, setValue] = React.useState(project?.value?.toString() || "");
  const [received, setReceived] = React.useState(project?.received?.toString() || "");

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setClient(project.client);
      setValue(project.value.toString());
      setReceived(project.received?.toString() || "0");
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !client || !value) return;

    if (project) {
      updateProject({
        ...project,
        name,
        client,
        value: parseFloat(value),
        received: parseFloat(received) || 0,
      });
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        client,
        value: parseFloat(value),
        received: parseFloat(received) || 0,
        status: 'pending'
      };
      setProjects([...projects, newProject]);
    }

    setOpen(false);
    if (!project) {
      setName("");
      setClient("");
      setValue("");
      setReceived("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Project Name</label>
            <Input 
              placeholder="E-commerce Redesign, Logo Design..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Client Name</label>
            <Input 
              placeholder="Acme Corp, John Doe..." 
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Total Value</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Advance Received</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-2xl shadow-lg shadow-primary/20">
              {project ? "Update Project" : "Add to Pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
