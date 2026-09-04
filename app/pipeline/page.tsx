"use client";

import { useFinanceStore, Project } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Plus, Kanban as KanbanIcon, CheckCircle2, Clock, PlayCircle, FileText } from "lucide-react";
import { motion, Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectDialog } from "@/components/add-project-dialog";
import { Edit2 } from "lucide-react";

const columns: { id: Project['status']; title: string; icon: any; color: string }[] = [
  { id: 'pending', title: 'Pipeline', icon: Clock, color: 'text-muted-foreground' },
  { id: 'in-progress', title: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
  { id: 'invoiced', title: 'Invoiced', icon: FileText, color: 'text-amber-500' },
  { id: 'paid', title: 'Completed', icon: CheckCircle2, color: 'text-primary' },
];

export default function PipelinePage() {
  const { projects, updateProjectStatus, settings, deleteProject } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 flex flex-col h-full lg:h-[calc(100vh-160px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Project Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage your freelance workload and invoices.</p>
        </div>
        <ProjectDialog />
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-none">
        {columns.map((col) => {
          const colProjects = projects.filter(p => p.status === col.id);
          const totalValue = colProjects.reduce((sum, p) => sum + Number(p.value), 0);

          return (
            <div key={col.id} className="w-80 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <col.icon className={cn("w-4 h-4", col.color)} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">{col.title}</h3>
                  <span className="bg-secondary text-[10px] font-bold px-2 py-0.5 rounded-full text-muted-foreground">
                    {colProjects.length}
                  </span>
                </div>
                <div className="text-xs font-bold tabular text-muted-foreground">
                  {formatCurrency(totalValue, settings.currency)}
                </div>
              </div>

              <div className="flex-1 bg-secondary/20 rounded-[2rem] p-4 space-y-4 overflow-y-auto border border-border/30">
                {colProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    layoutId={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-5 rounded-2xl group cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{project.client}</div>
                      <div className="flex gap-2">
                        <ProjectDialog project={project}>
                          <button className="p-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </ProjectDialog>
                        <button 
                          onClick={() => { if(confirm('Delete this project?')) deleteProject(project.id) }}
                          className="p-1 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                        >
                          <Plus className="w-2.5 h-2.5 rotate-45" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-4">{project.name}</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="text-lg font-black tabular tracking-tighter">
                          {formatCurrency(project.value || 0, settings.currency)}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {(project.received || 0) > 0 ? `${Math.round(((project.received || 0) / (project.value || 1)) * 100)}% Paid` : "No Advance"}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((project.received || 0) / (project.value || 1)) * 100)}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                          <span className="text-primary">Received: {formatCurrency(project.received || 0, settings.currency)}</span>
                          <span className="text-muted-foreground">Bal: {formatCurrency((project.value || 0) - (project.received || 0), settings.currency)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/30 flex gap-2">
                      {col.id !== 'paid' && (
                        <button 
                          onClick={() => {
                            const nextStatus = col.id === 'pending' ? 'in-progress' : col.id === 'in-progress' ? 'invoiced' : 'paid';
                            updateProjectStatus(project.id, nextStatus as Project['status']);
                          }}
                          className="flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          Move Forward
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {colProjects.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center p-8 opacity-20">
                    <div className="text-xs font-bold uppercase tracking-widest">Empty</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
