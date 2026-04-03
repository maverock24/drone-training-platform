"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Cpu, Camera, Radio, Server, Activity, ArrowRight, Zap } from "lucide-react";

export function InteractiveArchitecture() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes = {
    camera: {
      title: "OAK-D Lite (Stereo Vision)",
      description: "Captures high-res spatial data. Uses an onboard Myriad X chip to calculate Depth. Feeds pure RGB + Depth maps straight into the Jetson.",
      icon: <Camera className="w-8 h-8 text-blue-400" />,
      color: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20"
    },
    brain: {
      title: "NVIDIA Jetson Orin Nano",
      description: "The autonomous brain. Runs our Quantized INT8 Vision Transformer, detecting forest fires while communicating with the flight controller.",
      icon: <Cpu className="w-8 h-8 text-green-400" />,
      color: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
    },
    flightController: {
      title: "Pixhawk 6C (Autopilot)",
      description: "Manages PWM motor outputs, gyroscope alignment, and IMU data. Subscribes to MAVLink override commands sent from the Jetson.",
      icon: <Activity className="w-8 h-8 text-orange-400" />,
      color: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20"
    },
    cloud: {
      title: "Edge C2 Cluster (k8s)",
      description: "Maintains mission telemetry, triggers Active Learning DAGs, and queues successful weights for OTA deployments.",
      icon: <Server className="w-8 h-8 text-purple-400" />,
      color: "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20"
    },
    vtx: {
      title: "DJI O4 Air Unit",
      description: "Streams redundant 1080p 100fps encrypted video to the pilot's goggles, bypassing AI for a pure organic manual override connection.",
      icon: <Radio className="w-8 h-8 text-rose-400" />,
      color: "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20"
    }
  };

  return (
    <Card className="w-full bg-black/40 border-border/50 overflow-hidden my-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Zap className="text-yellow-400 w-5 h-5" />
          Interactive System Schema
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Click on any sub-system module below to interrogate its function in the hardware loop.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 mb-12 relative gap-4 px-4">
          {/* A fake "wire" connecting them */}
          <div className="hidden md:block absolute top-[50%] left-10 right-10 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-orange-500 opacity-20 -z-10 rounded-full" />
          
          <button
            onClick={() => setActiveNode("camera")}
            className={`w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-2 ${nodes.camera.color} ${activeNode === "camera" ? "ring-2 ring-blue-400 scale-105" : ""}`}
          >
            {nodes.camera.icon}
            <span className="text-xs font-bold text-center">Vision<br/>Payload</span>
          </button>
          
          <ArrowRight className="text-muted-foreground w-6 h-6 animate-pulse hidden md:block" />

          <button
            onClick={() => setActiveNode("brain")}
            className={`w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-2 ${nodes.brain.color} ${activeNode === "brain" ? "ring-2 ring-green-400 scale-105" : ""}`}
          >
            {nodes.brain.icon}
            <span className="text-xs font-bold text-center">Jetson<br/>Compute</span>
          </button>

          <ArrowRight className="text-muted-foreground w-6 h-6 animate-pulse hidden md:block" />

          <button
            onClick={() => setActiveNode("flightController")}
            className={`w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-2 ${nodes.flightController.color} ${activeNode === "flightController" ? "ring-2 ring-orange-400 scale-105" : ""}`}
          >
            {nodes.flightController.icon}
            <span className="text-xs font-bold text-center">Flight<br/>Controller</span>
          </button>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setActiveNode("cloud")}
              className={`w-32 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-2 ${nodes.cloud.color} ${activeNode === "cloud" ? "ring-2 ring-purple-400 scale-105" : ""}`}
            >
              {nodes.cloud.icon}
              <span className="text-xs font-bold text-center">Edge C2</span>
            </button>
            <button
              onClick={() => setActiveNode("vtx")}
              className={`w-32 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-2 ${nodes.vtx.color} ${activeNode === "vtx" ? "ring-2 ring-rose-400 scale-105" : ""}`}
            >
              {nodes.vtx.icon}
              <span className="text-xs font-bold text-center">DJI O4 VTX</span>
            </button>
          </div>
        </div>

        {/* Display Box */}
        <div className="h-32 border border-border/50 rounded-xl bg-muted/20 p-6 flex flex-col justify-center">
          {activeNode ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-bold text-foreground">
                {/* @ts-ignore */}
                {nodes[activeNode].title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {/* @ts-ignore */}
                {nodes[activeNode].description}
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground italic text-sm">
              Awaiting node selection telemetry...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
