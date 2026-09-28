import Navigation from "@/components/portfolio/Navigation";
import HeroSection from "@/components/portfolio/HeroSection";
import MarioMusic from "@/components/portfolio/MarioMusic";
import GameHUD from "@/components/portfolio/GameHUD";
import WorldTransition from "@/components/portfolio/WorldTransition";
import AboutSection from "@/components/portfolio/AboutSection";
import CompetenciesSection from "@/components/portfolio/CompetenciesSection";
import SkillsSection from "@/components/portfolio/SkillsSection";
import ExperienceSection from "@/components/portfolio/ExperienceSection";
import ProjectsSection from "@/components/portfolio/ProjectsSection";
import AchievementsSection from "@/components/portfolio/AchievementsSection";
import LeadershipSection from "@/components/portfolio/LeadershipSection";
import InterestsSection from "@/components/portfolio/InterestsSection";
import ContactSection from "@/components/portfolio/ContactSection";
import CastleVictory from "@/components/portfolio/CastleVictory";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarioMusic />
      <GameHUD />
      <Navigation />
      <HeroSection />
      <WorldTransition type="pipe-down" worldLabel="WORLD 1-2 — ABOUT" />
      <AboutSection />
      <WorldTransition type="underground-entry" worldLabel="WORLD 2-1 — POWER-UPS" />
      <CompetenciesSection />
      <WorldTransition type="sky-exit" worldLabel="WORLD 2-2 — SKILLS" />
      <SkillsSection />
      <WorldTransition type="pipe-down" worldLabel="WORLD 3-1 — EXPERIENCE" />
      <ExperienceSection />
      <WorldTransition type="sky-exit" worldLabel="WORLD 4-1 — PROJECTS" />
      <ProjectsSection />
      <WorldTransition type="underground-entry" worldLabel="WORLD 5-1 — ACHIEVEMENTS" />
      <AchievementsSection />
      <WorldTransition type="sky-exit" worldLabel="WORLD 6-1 — LEADERSHIP" />
      <LeadershipSection />
      <WorldTransition type="pipe-down" worldLabel="WORLD 7-1 — BONUS STAGE" />
      <InterestsSection />
      <WorldTransition type="castle-entry" worldLabel="WORLD 8-4 — FINAL CASTLE" />
      <ContactSection />
      <CastleVictory />
    </div>
  );
};

export default Index;
