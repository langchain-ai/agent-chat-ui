"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  trackLoginPageViewed,
  trackGoogleLoginClicked,
  trackLoginSuccess,
  trackLoginError,
  trackProfileConfirmationViewed,
  trackProfileFormFilled,
  trackProfileConfirmationSuccess,
  trackProfileConfirmationError,
  trackPersonalizeTravelViewed,
  trackImportOptionSelected,
  trackManualOptionSelected,
  trackSkipPersonalizationClicked,
  trackPersonalizeContinueClicked,
  trackQuizStarted,
  trackQuizStepViewed,
  trackQuizFieldChanged,
  trackQuizStepCompleted,
  trackQuizBackClicked,
  trackQuizCompleted,
  trackOnboardingCompleted,
  trackChatScreenReached,
} from '@/services/analyticsService';

// This page is for testing analytics events in development
// It should be excluded from production builds

export default function TestAnalyticsPage() {
  useEffect(() => {
    // Enable analytics debugger if available
    if (typeof window !== 'undefined' && window.analyticsDebugger) {
      window.analyticsDebugger.enable();
      window.analyticsDebugger.checkSetup();
    }
  }, []);

  const testLoginEvents = () => {
    console.log('🔐 Testing Login Events...');
    trackLoginPageViewed();
    trackGoogleLoginClicked();
    trackLoginSuccess(true);
    trackLoginError('Test error message');
  };

  const testProfileEvents = () => {
    console.log('👤 Testing Profile Events...');
    trackProfileConfirmationViewed();
    trackProfileFormFilled('firstName', true);
    trackProfileConfirmationSuccess({
      firstName: 'John',
      lastName: 'Doe',
      mobileNumber: '+1234567890',
      countryCode: '+1'
    });
    trackProfileConfirmationError('Test error');
  };

  const testPersonalizeEvents = () => {
    console.log('✈️ Testing Personalize Events...');
    trackPersonalizeTravelViewed();
    trackImportOptionSelected();
    trackManualOptionSelected();
    trackSkipPersonalizationClicked();
    trackPersonalizeContinueClicked('manual');
  };

  const testQuizEvents = () => {
    console.log('📝 Testing Quiz Events...');
    trackQuizStarted();
    trackQuizStepViewed(1, 'personal_details');
    trackQuizFieldChanged('gender', 'Male', 1);
    trackQuizStepCompleted(1, 'personal_details', { gender: 'Male' });
    trackQuizBackClicked(2, 'travel_style');
    trackQuizCompleted({
      gender: 'Male',
      dateOfBirth: new Date(),
      hasPassport: 'yes',
      travelFrequency: 'monthly',
      travelPurposes: ['business', 'leisure'],
      travelCompanions: ['alone'],
      loyaltyPrograms: ['airline_a'],
      currency: 'USD',
      language: 'English'
    });
  };

  const testCompletionEvents = () => {
    console.log('🎉 Testing Completion Events...');
    trackOnboardingCompleted({
      totalSteps: 5,
      completedSteps: ['login', 'profile', 'personalize', 'quiz'],
      skippedSteps: [],
      timeSpent: 300
    });
    trackChatScreenReached('onboarding_complete');
  };

  const testAllEvents = () => {
    testLoginEvents();
    setTimeout(() => testProfileEvents(), 500);
    setTimeout(() => testPersonalizeEvents(), 1000);
    setTimeout(() => testQuizEvents(), 1500);
    setTimeout(() => testCompletionEvents(), 2000);
  };

  const checkAnalyticsSetup = () => {
    if (typeof window !== 'undefined' && window.analyticsDebugger) {
      window.analyticsDebugger.checkSetup();
    } else {
      console.log('Analytics debugger not available');
    }
  };

  const viewCapturedEvents = () => {
    if (typeof window !== 'undefined' && window.analyticsDebugger) {
      const events = window.analyticsDebugger.getEvents();
      console.log('📊 Captured Events:', events);
    } else {
      console.log('Analytics debugger not available');
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Test Page Not Available in Production
          </h1>
          <p className="text-gray-600">
            This page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Analytics Events Test Page
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Instructions
            </h2>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Open browser developer console (F12)</li>
              <li>Click "Check Analytics Setup" to verify GA is loaded</li>
              <li>Click individual test buttons or "Test All Events"</li>
              <li>Check console for event logs and any errors</li>
              <li>Click "View Captured Events" to see all tracked events</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Button onClick={checkAnalyticsSetup} variant="outline">
              Check Analytics Setup
            </Button>
            <Button onClick={viewCapturedEvents} variant="outline">
              View Captured Events
            </Button>
            <Button onClick={testAllEvents} className="bg-blue-600 hover:bg-blue-700">
              Test All Events
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Login Events</h3>
              <Button onClick={testLoginEvents} variant="outline" size="sm" className="w-full">
                Test Login Events (4)
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Profile Events</h3>
              <Button onClick={testProfileEvents} variant="outline" size="sm" className="w-full">
                Test Profile Events (4)
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Personalize Events</h3>
              <Button onClick={testPersonalizeEvents} variant="outline" size="sm" className="w-full">
                Test Personalize Events (5)
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Quiz Events</h3>
              <Button onClick={testQuizEvents} variant="outline" size="sm" className="w-full">
                Test Quiz Events (6)
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Completion Events</h3>
              <Button onClick={testCompletionEvents} variant="outline" size="sm" className="w-full">
                Test Completion Events (2)
              </Button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Total Events Implemented</h3>
            <p className="text-gray-700">
              <strong>21 analytics events</strong> across the complete onboarding flow:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Login: 4 events</li>
              <li>Profile Confirmation: 4 events</li>
              <li>Personalize Travel: 5 events</li>
              <li>Onboarding Quiz: 6 events</li>
              <li>Completion: 2 events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
