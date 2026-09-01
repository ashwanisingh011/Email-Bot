import {Octokit} from '@octokit/rest'


export interface ActivityReport {
    prs: {
        title: string;
        body: string;
        url: string;
        state: string;
        repo: string
    }[];
    commits: string[];
}


export async function fetchDailyActivity(
    pat: string,
    username: string,
    repos: string[]
):Promise<ActivityReport> {
    const octokit = new Octokit({ auth: pat});

    // Set start of today in IST
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const activities: ActivityReport = { prs: [], commits: []};

    for(const fullRepo of repos){
        const [owner, repo] = fullRepo.split('/');
        if(!owner || !repo) continue;

        try {
            // 1. Fetch Pull Request
            const {data: prs} = await octokit.rest.pulls.list({
                owner,
                repo,
                state: "all",
                sort: "updated",
                direction: "desc",
                per_page: 20
            });

            const userPRs = prs.filter((pr) => {
                const isAuthor = pr.user?.login.toLowerCase() === username.toLowerCase();
                const updated  = new Date(pr.updated_at);
                return isAuthor && updated >= startOfDay;
            });

            for(const pr of userPRs){
                activities.prs.push({
                    title: pr.title,
                    body: pr.body || "",
                    url: pr.html_url,
                    state: pr.merged_at ? "merged" : pr.state,
                    repo: fullRepo,
                })
            }

            // 2. Fetch Commits by Author
            const {data: commits} = await octokit.rest.repos.listCommits({
                owner,
                repo,
                author: username,
                since: startOfDay.toISOString(),
            });

            for(const c of commits){
                activities.commits.push(`[${repo} ${c.commit.message}]`);
            }
        } catch (error) {
            console.error(`Error fetching activity for ${fullRepo}:`, error);
        }
    }
    return activities;
}